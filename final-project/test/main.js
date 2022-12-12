var topSVG = d3.select('#top');
var mapSVG = d3.select("#map");
var chartSVG = d3.select("#chart");

// width and height of top svg
const topSVGwidth = 1350;
const topSVGheight = 200;

// width and height of map
const w = 800;
const h = 800;

// width and height of chart svg
const chartSVGwidth = 550;
const chartSVGheight = 450;

// width and height of chart
const chartWidth = 350;
const chartHeight = 300;
const xOff = (chartSVGwidth - chartWidth) / 2;

const barHeight = 50;

// array that stores positions of each bar (necessary to make stacked bars)
var barPositions = []

const chartPadding = 75;

const titlePadding = 50;
const buttonBorder = 20;

// axes of chart
var xAxis, yAxis;
var xScale, yScale;

const csv = []; // array that holds relevant questions from all countries and all identities
const countryScores = new Map(); // key: countryname, value: current (?) score
const countryPercentages = new Map(); // key: countryname, value: array of percentages to each answer, [0] is very widespread, [3] is very rare
var selectedCountry = null;

topSVG.append('text')
    .text('Hostility Towards LGBT People in the EU')
    .attr('class', 'title')
    .attr('x', titlePadding)
    .attr('y', titlePadding);

topSVG.append('text')
    .text('In your opinion, how widespread is...')
    .attr('class', 'qheader')
    .attr('x', titlePadding)
    .attr('y', titlePadding*2);

topSVG.append('text')
    .text('... about lesbian, gay, bisexual, and/or transgender people by politicians in the country where you live?')
    .attr('class', 'qheader')
    .attr('x', topSVGwidth - titlePadding)
    .attr('text-anchor', 'end')
    .attr('y', titlePadding*2+80);

const buttonsText = ['Offensive Language', 'Casual Jokes', 'Expressions of Hatred and Aversion', 'Assaults and Harrassment'];
const buttonsLength = [];
const rectX = [];

const selectedButtons = new Map();
for (let i = 0; i < 4; i++) {
    selectedButtons.set(i, false);
}

var questionButtons = topSVG.selectAll('rect')
    .data(buttonsText)
    .enter();

questionButtons.append('rect')
    .attr('id', function(d, i) {return 'rect' + i;})
    .attr('class', 'qbutton')
    .attr('y', titlePadding*7/3)
    .attr('rx', 20)
    .attr('ry', 20)

questionButtons.append('text')
    .text(function(d, i) {return buttonsText[i];})
    .attr('class', 'qtext')
    .attr('y', titlePadding*7/3 + 25)
    .each(function(d, i) { buttonsLength[i] = this.getComputedTextLength()});

questionButtons.selectAll('rect')
    .attr('width', function(d, i) { 
        return buttonsLength[i] + buttonBorder; 
    })
    .attr('x', function(d, i) {
        if (i == 0) {
            rectX[i] = titlePadding;
        }
        else {
            rectX[i] = (buttonBorder*2 + Number(d3.select(this.previousSibling).attr('x')) + Number(buttonsLength[i-1]))
        }
        return rectX[i];
    })
    .on('click', function(d, i) {
        if (selectedButtons.get(i) == true) {
            selectedButtons.set(i, false);
            topSVG.select('#rect' + i).attr('class', 'qbutton');
        } else {
            selectedButtons.set(i, true);
            topSVG.select('#rect' + i).attr('class', 'qbuttonpressed');
        }
        updateCountries();

        // array that holds relevant question for selected country and all identities
        countryCSV = [];
        
        // only include info for relevant country
        // for the 4 questions we're using
        var button0 = selectedButtons.get(0);
        var button1 = selectedButtons.get(1);
        var button2 = selectedButtons.get(2);
        var button3 = selectedButtons.get(3);
        for (let i = 0; i < csv.length; ++i) {
            if ((csv[i].CountryCode == selectedCountry)) {
                if (csv[i].question_code == "b1_a" && button0) countryCSV.push(csv[i]);
                if (csv[i].question_code == "b1_b" && button1) countryCSV.push(csv[i]);
                if (csv[i].question_code == "b1_c" && button2) countryCSV.push(csv[i]);
                if (csv[i].question_code == "b1_d" && button3) countryCSV.push(csv[i]);
            }
        }
        if (countryCSV.length > 0) {
            updateBarChart(countryCSV);
        } else {
            blankBarChart();
        }    });

questionButtons.selectAll('.qtext')
    .attr('x', function(d, i) { 
        if (i==0) return titlePadding + buttonsLength[i]/2 + buttonBorder/2;
        else return (rectX[i] + buttonsLength[i]/2 + buttonBorder/2);//(30 + Number(d3.select(this.previousSibling).attr('x')) + Number(buttonsLength[i])/2);
    });


d3.csv('LGBT_Survey_DailyLife.csv').then(function(dataset, json) {
    // defining map projection
    let projection = d3.geoMercator()
        .center([15, 54])
        .translate([(w / 2) + 20, (h / 2) + 45])
        .scale(600);

    // defining path generator for geoJSON
    let path = d3.geoPath()
        .projection(projection);
    var textlayer;

    // loading in geoJSON data
    d3.json('europeMed.json').then(function(json) {
        initializeData(dataset, json)
        // binding data and creating one path per GeoJSON feature
        var enter = mapSVG.selectAll('g')
            .data(json.features)
            .enter()
            .append('g');

        enter.append('path')
            .attr('d', path)
            .attr('class', 'normalpath')
            .attr('fill', '#e9e9e9')
            .on('mouseover', function(d, i) {
                mapSVG.append('text').text(d.properties.NAME)
                    .attr('class', 'hovertext')
                    .attr('id', 'hoveringtext')
                    .attr('x', function(data, i) {
                        return path.centroid(d)[0];
                    })
                    .attr('y', function(data, i) {
                        return path.centroid(d)[1];
                    })
                    .attr('pointer-events', 'none');
            })
            .on('mouseout', function(d, i) {
                d3.select('#hoveringtext').remove();
            })
            .on('click', function(d, i) {
                selectedCountry = d.properties.NAME;
                // mapSVG.append(this);
                d3.selectAll('.selectedpath').attr('class', 'normalpath');
                d3.select(this).attr('class', 'selectedpath');
                d3.select('#selectedtext').remove();

                mapSVG.append('text').text(d.properties.NAME)
                .attr('class', 'hovertext')
                .attr('id', 'selectedtext')
                .attr('x', function(data, i) {
                    return path.centroid(d)[0];
                })
                .attr('y', function(data, i) {
                    return path.centroid(d)[1];
                })
                .attr('pointer-events', 'none');


                // array that holds relevant question for selected country and all identities
                countryCSV = [];

                // only include info for relevant country
                // for the 4 questions we're using
                var button0 = selectedButtons.get(0);
                var button1 = selectedButtons.get(1);
                var button2 = selectedButtons.get(2);
                var button3 = selectedButtons.get(3);
                for (let j = 0; j < csv.length; j++) {
                    if ((csv[j].CountryCode == d.properties.NAME)) {
                        if (csv[j].question_code == "b1_a" && button0) countryCSV.push(csv[j]);
                        if (csv[j].question_code == "b1_b" && button1) countryCSV.push(csv[j]);
                        if (csv[j].question_code == "b1_c" && button2) countryCSV.push(csv[j]);
                        if (csv[j].question_code == "b1_d" && button3) countryCSV.push(csv[j]);
                    }
                }

                // only update chart if the country has data
                if (countryCSV.length > 0) {
                    updateBarChart(countryCSV);
                } else {
                    blankBarChart();
                }
            });
    });
});

var countryCSV;

var numofbuttons;

function initializeData(dataset, json) {
    for (let i = 0; i < dataset.length; ++i) {
        if (dataset[i].question_code == 'b1_a' || dataset[i].question_code == 'b1_b' 
        || dataset[i].question_code == 'b1_c' || dataset[i].question_code == 'b1_d') {
        csv.push(dataset[i]);
        }
        // b1_a is offensive language by politicians, b1_b is casual jokes
        // b1_c is expressions of hatred and aversion, b1_d is assaults and harrassment
    }
    // loop through added ones, check country
    initializeScores();
}

function initializeScores() {
    for (let i = 0; i < csv.length; i++) {
        let name = csv[i].CountryCode;
        countryScores.set(name, 0);
        let temp = countryPercentages.get(name);
        if (temp != null && temp.length > 0) {
            if (csv[i].answer == 'Very widespread') {
                temp[0] += csv[i].percentage;
            } else if (csv[i].answer == 'Fairly widespread') {
                temp[1] += csv[i].percentage;
            } else if (csv[i].answer == 'Fairly rare') {
                temp[2] += csv[i].percentage;
            } else if (csv[i].answer == 'Very rare') {
                temp[3] += csv[i].percentage;
            }
        } else {
            countryPercentages.set(name, [0,0,0,0]);
        }
    }
}

function updateCountries() {
    initializeScores();
    numofbuttons = 0;
    for (let i = 0; i < 4; i++) {
        if (selectedButtons.get(i) == true) {
            numofbuttons += 1;
        }
    }
    mapSVG.selectAll('g')
        .selectAll('path')
            .attr('fill', function(d, i) {
                let obj = updateScore(d.properties.NAME);
                if (obj.found) {
                    var s = obj.score;
                    if (s > (250 * numofbuttons)) { // best
                        return '#ffc3ba';
                    } else if (s > (225 * numofbuttons)) {
                        return '#ffa89b';
                    } else if (s > (-25 * numofbuttons)) {
                        return '#ff7c68'
                    } else { // worst
                        return '#ff5035';
                    }
                } else {
                    return '#e9e9e9';
                }
            });
}

function updateScore(countryName) {
    var score;
    if (countryScores.has(countryName)) {
        score = Number(countryScores.get(countryName));
    } else {
        score = 0;
    }
    var found = false;
    // check which questions are selected
    for (let i = 0; i < csv.length; i++) {
        if (csv[i].CountryCode == countryName) {
            if (selectedButtons.get(0) && csv[i].question_code == "b1_a") {
                var found = true;
                if (csv[i].answer == 'Very widespread') { // very widespread hate = lower score
                    score -= Number(csv[i].percentage);
                } else if (csv[i].answer == 'Fairly widespread') {
                    score -= 0;
                } else if (csv[i].answer == 'Fairly rare') {
                    score += Number(csv[i].percentage);
                } else if (csv[i].answer == 'Very rare') {
                    score += Number((2 * csv[i].percentage));
                }
            }
            if (selectedButtons.get(1) && csv[i].question_code == "b1_b") {
                var found = true;
                if (csv[i].answer == 'Very widespread') { // very widespread hate = lower score
                    score -= Number(csv[i].percentage);
                } else if (csv[i].answer == 'Fairly widespread') {
                    score -= 0;
                } else if (csv[i].answer == 'Fairly rare') {
                    score += Number(csv[i].percentage);
                } else if (csv[i].answer == 'Very rare') {
                    score += Number((2 * csv[i].percentage));
                }
            }
            if (selectedButtons.get(2) && csv[i].question_code == "b1_c") {
                var found = true;
                if (csv[i].answer == 'Very widespread') { // very widespread hate = lower score
                    score -= Number(csv[i].percentage);
                } else if (csv[i].answer == 'Fairly widespread') {
                    score -= 0;
                } else if (csv[i].answer == 'Fairly rare') {
                    score += Number(csv[i].percentage);
                } else if (csv[i].answer == 'Very rare') {
                    score += Number((2 * csv[i].percentage));
                }
            }
            if (selectedButtons.get(3) && csv[i].question_code == "b1_d") {
                var found = true;
                if (csv[i].answer == 'Very widespread') { // very widespread hate = lower score
                    score -= Number(csv[i].percentage);
                } else if (csv[i].answer == 'Fairly widespread') {
                    score -= 0;
                } else if (csv[i].answer == 'Fairly rare') {
                    score += Number(csv[i].percentage);
                } else if (csv[i].answer == 'Very rare') {
                    score += Number((2 * csv[i].percentage));
                }
            }
        }
    }
    countryScores.set(countryName, score);
    return {score: score, found: found};
}


function updateBarChart(countryCSV) {
    // clearing
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // title (country name)
    chartSVG.append('text')
        .text(selectedCountry)
        .attr('class', 'title')
        .attr('x', titlePadding)
        .attr('y', titlePadding);

    // setting up data array
    var data = [
        {identity: 'Lesbian', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Gay', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Bisexual women', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Bisexual men', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Transgender', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0} 
    ];

    // updating data array for buttons selected
    for (let i = 0; i < countryCSV.length; i++) {
        let index = 5;
        if (countryCSV[i].subset == 'Lesbian') index = 0;
        if (countryCSV[i].subset == 'Gay') index = 1;
        if (countryCSV[i].subset == 'Bisexual women') index = 2;
        if (countryCSV[i].subset == 'Bisexual men') index = 3;
        if (countryCSV[i].subset == 'Transgender') index = 4;
        if ((selectedButtons.get(0) && countryCSV[i].question_code == "b1_a") || (selectedButtons.get(1) && countryCSV[i].question_code == "b1_b")
        || (selectedButtons.get(2) && countryCSV[i].question_code == "b1_c") || (selectedButtons.get(3) && countryCSV[i].question_code == "b1_d")) {
            if (countryCSV[i].answer == 'Very widespread') data[index].veryWidespread += Number(countryCSV[i].percentage); 
            if (countryCSV[i].answer == 'Fairly widespread') data[index].fairlyWidespread += Number(countryCSV[i].percentage);
            if (countryCSV[i].answer == 'Fairly rare') data[index].fairlyRare += Number(countryCSV[i].percentage); 
            if (countryCSV[i].answer == 'Very rare') data[index].veryRare += Number(countryCSV[i].percentage);
            if (countryCSV[i].answer == 'Don`t know') data[index].idk += Number(countryCSV[i].percentage);
        }
    }

    // normalizing data
    for (let i = 0; i < data.length; i++) {
        var total = data[i].veryWidespread + data[i].fairlyWidespread + data[i].fairlyRare + data[i].veryRare + data[i].idk;
        data[i].veryWidespread /= total;
        data[i].fairlyWidespread /= total;
        data[i].fairlyRare /= total;
        data[i].veryRare /= total;
        data[i].idk /= total;
    }
    // setting up stack method
	var stack = d3.stack()
        .keys(['veryWidespread', 'fairlyWidespread', 'fairlyRare', 'veryRare', 'idk']);

    // stacking data
    var series = stack(data);

    // color scale
    var colorScale = d3.scaleOrdinal()
        .domain(['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Don`t know'])
        .range(['#ff5035','#ff7c68','#ffa89b','#ffc3ba', '#e9e9e9']);
        
    // setting up scales
    xScale = d3.scaleLinear()
        .domain([0,1])
        .range([0, chartWidth]); 
    xAxis = d3.axisBottom(xScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartSVGheight - chartPadding) + ")"
        })
        .call(xAxis);
    yScale = d3.scaleBand()
        .domain(["Lesbian", "Gay", "Bisexual women", "Bisexual men", "Transgender"])
        .range([0, chartHeight]);
    yAxis = d3.axisLeft(yScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartPadding) + ")"
        })
        .call(yAxis);

    // adding bars
    // select all elements classed bar
    var barElements = chartSVG.selectAll('.bar')
        .data(series);
    // create bar gs and append to bar elements
    var barEnter = barElements.enter()
        .append('g')
        .attr('class', 'bar')
        .style('fill', function(d) {return colorScale(d.key)});

    
    barEnter.selectAll('rect')
        .data(function(d) { return d; })
		.enter()
        .append('rect')
        .attr('width', function(d, i) {
            return (xScale(d[1]) - xScale(d[0]));
        })
        .attr('height', barHeight)
        .attr('x', function (d, i) {
            return xOff + xScale(d[0]);
        })
        .attr('y', function(d, i) {
            var identity;
            if (i == 0) identity = "Lesbian";
            else if (i == 1) identity = "Gay";
            else if (i == 2) identity = "Bisexual women";
            else if (i == 3) identity = "Bisexual men";
            else if (i == 4) identity = "Transgender";
            return chartPadding + yScale(identity);
        });

}

function blankBarChart() {
    // clearing
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

        // if country is selected, display blank chart
        if (selectedCountry != null) {

    // setting up data array
    var data = [
        {identity: 'Lesbian', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Gay', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Bisexual women', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Bisexual men', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Transgender', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1} 
    ];
    // stack
    var stack = d3.stack()
        .keys(['veryWidespread', 'fairlyWidespread', 'fairlyRare', 'veryRare', 'idk']);
    var series = stack(data);

    // color scale
    var colorScale = d3.scaleOrdinal()
        .domain(['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Don`t know'])
        .range(['#ff5035','#ff7c68','#ffa89b','#ffc3ba', '#e9e9e9']);

    // setting up scales
    xScale = d3.scaleLinear()
        .domain([0,1])
        .range([0, chartWidth]); 
    xAxis = d3.axisBottom(xScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartSVGheight - chartPadding) + ")"
        })
        .call(xAxis);
    yScale = d3.scaleBand()
        .domain(["Lesbian", "Gay", "Bisexual women", "Bisexual men", "Transgender"])
        .range([0, chartHeight]);
    yAxis = d3.axisLeft(yScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartPadding) + ")"
        })
        .call(yAxis);


            chartSVG.append('text')
            .text(selectedCountry)
            .attr('class', 'title')
            .attr('x', titlePadding)
            .attr('y', titlePadding);
        

    // adding bars
    // select all elements classed bar
    var barElements = chartSVG.selectAll('.bar')
        .data(series);
    // create bar gs and append to bar elements
    var barEnter = barElements.enter()
        .append('g')
        .attr('class', 'bar')
        .style('fill', function(d) {return colorScale(d.key)});

    
    barEnter.selectAll('rect')
        .data(function(d) { return d; })
		.enter()
        .append('rect')
        .attr('width', function(d, i) {
            return (xScale(d[1]) - xScale(d[0]));
        })
        .attr('height', barHeight)
        .attr('x', function (d, i) {
            return xOff + xScale(d[0]);
        })
        .attr('y', function(d, i) {
            var identity;
            if (i == 0) identity = "Lesbian";
            else if (i == 1) identity = "Gay";
            else if (i == 2) identity = "Bisexual women";
            else if (i == 3) identity = "Bisexual men";
            else if (i == 4) identity = "Transgender";
            return chartPadding + yScale(identity);
        });}}
