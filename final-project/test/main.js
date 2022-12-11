var topSVG = d3.select('#top');
var mapSVG = d3.select("#map");
var chartSVG = d3.select("#chart");

// width and height of top svg
const topSVGwidth = 1350;
const topSVGheight = 200;

// width and height of map
let w = 800;
let h = 800;

// width and height of chart svg
var chartSVGwidth = 550;
var chartSVGheight = 450;

// width and height of chart
var chartWidth = 350;
var chartHeight = 300;

var barHeight = 50;

// array that stores positions of each bar (necessary to make stacked bars)
var barPositions = []

var chartPadding = 75;

const titlePadding = 50;
const buttonBorder = 20;

// axes of chart
var xAxis, yAxis;
var xScale, yScale;

const csv = []; // array that holds relevant questions from all countries and all identities
const countryScores = new Map(); // key: countryname, value: current (?) score
const countryPercentages = new Map(); // key: countryname, value: array of percentages to each answer, [0] is very widespread, [3] is very rare

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
    });
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
                // console.log(d3.select('#hoveringtext'));
                d3.select('#hoveringtext').remove();
            })
            .on('click', function(d, i) {
                // initially hide bar chart
                hideBarChart();

                // array that holds relevant question for selected country and all identities
                var countryCSV = [];

                // only include info for relevant country
                // testing with first question initially - should change later
                for (let i = 0; i < dataset.length; ++i) {
                    if ((dataset[i].CountryCode == d.properties.NAME) && 
                        (dataset[i].question_code == 'b1_a')) {
                        countryCSV.push(dataset[i]);
                    }
                }

                // only update chart if the country has data
                if (countryCSV.length > 0) {
                    updateBarChart(countryCSV);
                }
            });
    });
});

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
    var numofbuttons = 0;
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
                    return '#e9e9e9'
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

function hideBarChart() {
    // could change this to span to include everything?
    chartSVG.selectAll('g').remove();
}

function updateScoreBars(countryName, identity) {
    
}

function updateBarChart(countryCSV) {

    // initialize bar chart

    //x axis
    xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, chartWidth]);

    xAxis = d3.axisBottom(xScale);

    chartSVG.append('g')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartSVGheight - chartPadding) + ")"
        })
        .call(xAxis);

    // y axis
    yScale = d3.scaleOrdinal()
        .domain(["Lesbian", "Gay", "Bisexual women", "Bisexual men", "Transgender", ""])
        .range([0, chartHeight * 1/5, chartHeight * 2/5, chartHeight * 3/5, chartHeight * 4/5, chartHeight]);

    yAxis = d3.axisLeft(yScale);

    chartSVG.append('g')
        .attr("transform", function() {
            return "translate(" + (chartSVGwidth - chartWidth) / 2
            + "," + (chartPadding) + ")"
        })
        .call(yAxis);

    // add bars
    var barElements = chartSVG.selectAll('.bar')
        .data(countryCSV, function(d) {
            return d.subset;
        })

    //create bars and append to bar elements
    var barEnter = barElements.enter().append('g').attr("class", "bar");

    barEnter
        .append('rect')
        .attr("width", function(d, i) {
            return xScale(d.percentage);
        })
        .attr("height", barHeight)
        .attr("transform", function(d, i) {
            
            // the position of each bar is dependent on the width of the bars before it
            // if the bar is the first of the subset (i % 5 == 0), then it should
            // start at the y axis
            var barPosition = (i % 5 == 0 ? 0 : xScale(countryCSV[i - 1].percentage));
            if (i % 5 != 0) {
                barPositions[i] = barPositions[i - 1] + barPosition;
            } else {
                barPositions[i] = (chartSVGwidth - chartWidth) / 2;
            }

            return "translate(" + barPositions[i]
            + "," + (yScale(d.subset) - (barHeight / 2) + chartPadding) + ")"
        })
        .attr("fill", function(d, i) {
            if (d.answer == "Very widespread") {
                return '#ff5035'
            } else if (d.answer == "Fairly widespread") {
                return '#ff7c68'
            } else if (d.answer == "Fairly rare") {
                return '#ffa89b'
            } else if (d.answer == "Very rare") {
                return '#ffc3ba'
            } else {
                return '#e9e9e9'
            }
        });

}

