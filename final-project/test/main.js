var topSVG = d3.select('#top');
var mapSVG = d3.select("#map");
var chartSVG = d3.select("#chart");
var bottomSVG = d3.select("#bottom");

// width and height of top svg
const topSVGwidth = 1350;
const topSVGheight = 200;

// width and height of identities svg
const bottomSVGwidth = 650;
const bottomSVGheight = 150;

// width and height of map
const w = 900;
const h = 800;

// width and height of chart svg
const chartSVGwidth = 650;
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

var validSelectedCountry = false;

//identity buttons - only need to update value on idenButton click if it's a global var
var idenButton0;
var idenButton1;
var idenButton2;
var idenButton3;
var idenButton4;

var countryCSV;

var numofbuttons;

const csv = []; // array that holds relevant questions from all countries and all identities
const countryScores = new Map(); // key: countryname, value: current (?) score
const countryPercentages = new Map(); // key: countryname, value: array of percentages to each answer, [0] is very widespread, [3] is very rare
var selectedCountry = null;

// color scale
var colorScale = d3.scaleOrdinal()
    .domain(['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Don`t know'])
    .range(['#ff5035','#ff7c68','#ffa89b','#ffc3ba', '#e9e9e9']);

topSVG.append('text')
    .text('Hostility Towards LGBT People in the EU')
    .attr('class', 'title')
    .attr('x', titlePadding)
    .attr('y', titlePadding);

topSVG.append('text')
    .text('In your opinion, how widespread are...')
    .attr('class', 'qheader')
    .attr('x', titlePadding)
    .attr('y', titlePadding*2);

topSVG.append('text')
    .text('... about lesbian, gay, bisexual, and/or transgender people in the country where you live?')
    .attr('class', 'qheader')
    .attr('x', topSVGwidth - titlePadding)
    .attr('text-anchor', 'end')
    .attr('y', titlePadding*2+80);

const buttonsText = ['Offensive language', 'Casual jokes', 'Expressions of hatred and aversion', 'Assaults and harrassment'];
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

        // array that holds relevant question for selected country and all identities
        countryCSV = [];
        
        // only include info for relevant country
        // for the 4 questions we're using
        var button0 = selectedButtons.get(0);
        var button1 = selectedButtons.get(1);
        var button2 = selectedButtons.get(2);
        var button3 = selectedButtons.get(3);

        //filter the csv by question code
        for (let i = 0; i < csv.length; i++) {
            if ((csv[i].CountryCode == selectedCountry)) {
                if ((csv[i].question_code == "b1_a" && button0)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_b" && button1)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_c" && button2)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_d" && button3)) countryCSV.push(csv[i]);
            }
        }

        // update coloring of map to reflect selected buttons
        updateCountries();
        if (countryCSV.length > 0) {
            updateBarChart(countryCSV);
        } else {
            blankBarChart();
        }    
    });

questionButtons.selectAll('.qtext')
    .attr('x', function(d, i) { 
        if (i==0) return titlePadding + buttonsLength[i]/2 + buttonBorder/2;
        else return (rectX[i] + buttonsLength[i]/2 + buttonBorder/2);//(30 + Number(d3.select(this.previousSibling).attr('x')) + Number(buttonsLength[i])/2);
    });

//identity buttons
bottomSVG.append('text')
    .text('Identity of respondents')
    .attr('class', 'subtitle')
    .attr('x', titlePadding)
    .attr('y', titlePadding);

const idenButtonsText = ['Lesbian', 'Gay', 'Bisexual women', 'Bisexual men', 'Transgender'];
const idenButtonsLength = [];
const idenRectX = [];

const selectedIdenButtons = new Map();
for (let i = 0; i < 5; i++) {
    selectedIdenButtons.set(i, true);
}

var idenButtons = bottomSVG.selectAll('rect')
    .data(idenButtonsText)
    .enter();

idenButtons.append('rect')
    .attr('id', function(d, i) {return 'rect' + i;})
    .attr('class', 'qbuttonpressed')
    .attr('y', titlePadding*4/3)
    .attr('rx', 20)
    .attr('ry', 20)

idenButtons.append('text')
    .text(function(d, i) {return idenButtonsText[i];})
    .attr('class', 'qtext')
    .attr('y', titlePadding*4/3 + 25)
    .each(function(d, i) { idenButtonsLength[i] = this.getComputedTextLength()});

idenButtons.selectAll('rect')
    .attr('width', function(d, i) { 
        return idenButtonsLength[i] + buttonBorder; 
    })
    .attr('x', function(d, i) {
        if (i == 0) {
            idenRectX[i] = titlePadding;
        }
        else {
            idenRectX[i] = (buttonBorder*2 + Number(d3.select(this.previousSibling).attr('x')) + Number(idenButtonsLength[i-1]))
        }
        return idenRectX[i];
    })
    .on('click', function(d, i) {
        if (selectedIdenButtons.get(i) == true) {
            selectedIdenButtons.set(i, false);
            bottomSVG.select('#rect' + i).attr('class', 'qbutton');
        } else {
            selectedIdenButtons.set(i, true);
            bottomSVG.select('#rect' + i).attr('class', 'qbuttonpressed');
        }
        // array that holds relevant question for selected country and all identities
        countryCSV = [];
        
        idenButton0 = selectedIdenButtons.get(0);
        idenButton1 = selectedIdenButtons.get(1);
        idenButton2 = selectedIdenButtons.get(2);
        idenButton3 = selectedIdenButtons.get(3);
        idenButton4 = selectedIdenButtons.get(4);

        var button0 = selectedButtons.get(0);
        var button1 = selectedButtons.get(1);
        var button2 = selectedButtons.get(2);
        var button3 = selectedButtons.get(3);

        //filter the csv by question code and subset
        for (let i = 0; i < csv.length; i++) {
            if ((csv[i].CountryCode == selectedCountry)) {
                if ((csv[i].question_code == "b1_a" && button0)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_b" && button1)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_c" && button2)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_d" && button3)) countryCSV.push(csv[i]);
            }
        }
        // update coloring of map to reflect selected identity buttons
        updateCountries();
        if (countryCSV.length > 0) {
            updateBarChart(countryCSV);
        } else {
            blankBarChart();
        }   
    });

idenButtons.selectAll('.qtext')
    .attr('x', function(d, i) { 
        if (i==0) return titlePadding + idenButtonsLength[i]/2 + buttonBorder/2;
        else return (idenRectX[i] + idenButtonsLength[i]/2 + buttonBorder/2);//(30 + Number(d3.select(this.previousSibling).attr('x')) + Number(buttonsLength[i])/2);
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
            .attr('fill', function(d, i) {
                let obj = updateScore(d.properties.NAME);
                if (obj.found) {
                    var s = obj.score;
                    if (s < min + (diff/4)) { 
                        return colorScale('Very widespread');
                    } else if (s < min + (diff/2)) {
                        return colorScale('Fairly widespread');
                    } else if (s < min + (diff*3/4)) {
                        return colorScale('Fairly rare');
                    } else { // worst
                        return colorScale('Very rare');
                    }
                } else {
                    return '#e9e9e9';
                }
            })
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
                validSelectedCountry = false;
                for (let i = 0; i < csv.length; i++) {
                    if (csv[i].CountryCode == selectedCountry) {
                        validSelectedCountry = true;
                        break;
                    }
                }
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

                //filter the csv by question code and subset
                for (let j = 0; j < csv.length; j++) {
                    if ((csv[j].CountryCode == d.properties.NAME)) {
                        if ((csv[j].question_code == "b1_a" && button0)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_b" && button1)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_c" && button2)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_d" && button3)) countryCSV.push(csv[j]);
                    }
                }

                // update coloring of map to reflect selected buttons
                if (countryCSV.length > 0 && validSelectedCountry) {
                    updateBarChart(countryCSV);
                } else {
                    blankBarChart();
                }
            });
            appendKey();
    });
});

function appendKey() {
    var keyg = mapSVG.append('g');
    
    keyg.append('text')
        .attr('class', 'subtitle')
        .text('Relative hostility')
        .attr('transform', 'translate(710, 300)');

    var gEnter = keyg.selectAll('g')
        .data(['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Unsure / no data'])
        .enter()
        .append('g');
    gEnter.append('rect')
        .attr('class', 'keyrect')
        .attr('fill', function(d, i) {
            if (i<4) return colorScale(d);
            else return colorScale('Don`t know');
        })
        .attr('width', 15)
        .attr('height', 15)
        .attr('x', 710)
        .attr('y', function(d, i) {
            return 315 + i*30;
        });
    gEnter.append('text')
        .attr('class', 'keylabel')
        .text(function(d, i) {return d;})
        .attr('x', 740)
        .attr('y', function(d, i) {
            return 327 + i*30;
        });
        

}

//pass in index of csv, return whether or not that index contains a specific identity
function filterIdentities(i) {
    if (csv[i].subset == "Lesbian" && idenButton0) return true;
    if (csv[i].subset == "Gay" && idenButton1) return true;
    if (csv[i].subset == "Bisexual women" && idenButton2) return true;
    if (csv[i].subset == "Bisexual men" && idenButton3) return true;
    if (csv[i].subset == "Transgender" && idenButton4) return true;
    return false;
}

function initializeData(dataset, json) {
    for (let i = 0; i < dataset.length; ++i) {
        if (dataset[i].question_code == 'b1_a' || dataset[i].question_code == 'b1_b' 
        || dataset[i].question_code == 'b1_c' || dataset[i].question_code == 'b1_d') {
        csv.push(dataset[i]);
        }
        // b1_a is offensive language by politicians, b1_b is casual jokes
        // b1_c is expressions of hatred and aversion, b1_d is assaults and harrassment
    }
    // initialize identity buttons
    idenButton0 = selectedIdenButtons.get(0);
    idenButton1 = selectedIdenButtons.get(1);
    idenButton2 = selectedIdenButtons.get(2);
    idenButton3 = selectedIdenButtons.get(3);
    idenButton4 = selectedIdenButtons.get(4);
    // loop through added ones, check country
    initializeScores();
    initializeBarChart();
}

function initializeScores() {
    for (let i = 0; i < csv.length; i++) {
        let name = csv[i].CountryCode;
        countryScores.set(name, 0);
        let temp = countryPercentages.get(name);
        if (temp != null && temp.length > 0) {
            if (csv[i].answer == 'Very widespread') {temp[0] += csv[i].percentage;} 
            else if (csv[i].answer == 'Fairly widespread') {temp[1] += csv[i].percentage;} 
            else if (csv[i].answer == 'Fairly rare') {temp[2] += csv[i].percentage;} 
            else if (csv[i].answer == 'Very rare') {temp[3] += csv[i].percentage;}
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
            .each(function(d, i) {
                updateScore(d.properties.NAME);
            });

    var ok = [];
    for (let [key, value] of countryScores) {
        if (value != null && value != 0 && !isNaN(value)) {
            ok.push(value);
        }
    }
    var min = Math.min(...ok);
    var max = Math.max(...ok);
    var diff = max-min;


    mapSVG.selectAll('g')
        .selectAll('path')
        .attr('fill', function(d, i) {
            let obj = updateScore(d.properties.NAME);
            if (obj.found) {
                var s = obj.score;
                if (s < min + (diff/4)) { 
                    return colorScale('Very widespread');
                } else if (s < min + (diff/2)) {
                    return colorScale('Fairly widespread');
                } else if (s < min + (diff*3/4)) {
                    return colorScale('Fairly rare');
                } else { // worst
                    return colorScale('Very rare');
                }
            } else {
                return '#e9e9e9';
            }
        });
        
}

function updateScore(countryName) {
    var score = 0;
    var times = 0;
    var found = false; // keeping track of whether we succeeded in finding the country in the csv
    for (let i = 0; i < csv.length; i++) {
        let row = csv[i];
        // check if correct country, and if the answer is for the selected questions (from buttons)
        if (csv[i].CountryCode == countryName && ((selectedButtons.get(0) && row.question_code == "b1_a") || (selectedButtons.get(1) && row.question_code == "b1_b")
        || (selectedButtons.get(2) && row.question_code == "b1_c") || (selectedButtons.get(3) && row.question_code == "b1_d"))
        && (filterIdentities(i))) {
            var found = true;
            if (row.answer == 'Very widespread') {score += Number(row.percentage); times+=1;}
            else if (row.answer == 'Fairly widespread') {score += (2*Number(row.percentage)); times+=1;}
            else if (row.answer == 'Fairly rare') {score += (3*Number(row.percentage)); times+=1;}
            else if (row.answer == 'Very rare') {score += (4*Number(row.percentage)); times+=1;}
            // if (row.answer == 'Don`t know') score += Number(row.percentage);
        }
    }
    countryScores.set(countryName, score/times);
    return {score: score/times, found: found, times: times};
}

function updateBarChart(countryCSV) {
    // clearing
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // title (country name)
    chartSVG.append('text')
        .text(selectedCountry + ' response breakdown')
        .attr('class', 'subtitle')
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
            else if (countryCSV[i].answer == 'Fairly widespread') data[index].fairlyWidespread += Number(countryCSV[i].percentage);
            else if (countryCSV[i].answer == 'Fairly rare') data[index].fairlyRare += Number(countryCSV[i].percentage); 
            else if (countryCSV[i].answer == 'Very rare') data[index].veryRare += Number(countryCSV[i].percentage);
            else if (countryCSV[i].answer == 'Don`t know') data[index].idk += Number(countryCSV[i].percentage);
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
        
    // setting up scales
    xScale = d3.scaleLinear()
        .domain([0,100])
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
        .attr('id', function(d, i) {
            return 'bar'+i;
        })
        .attr('class', 'bar');
    // add rectangles for each bar
    barEnter.selectAll('rect')
        .data(function(d) { return d; })
		.enter()
        .append('rect')
        .attr('width', function(d, i) {
            return (xScale(d[1]*100) - xScale(d[0]*100));
        })
        .attr('height', barHeight)
        .attr('x', function (d, i) {
            return xOff + xScale(d[0]*100);
        })
        .attr('y', function(d, i) {
            var identity;
            if (i == 0) identity = "Lesbian";
            else if (i == 1) identity = "Gay";
            else if (i == 2) identity = "Bisexual women";
            else if (i == 3) identity = "Bisexual men";
            else if (i == 4) identity = "Transgender";
            return chartPadding + yScale(identity);
        })
        .style('fill', function(d, i) {
            if ((i==0 && idenButton0) || (i==1 && idenButton1) || (i==2 && idenButton2) || (i==3 && idenButton3) || (i==4 && idenButton4)) {
                var id = d3.select(this.parentNode).attr('id');
                if (id == 'bar0') return colorScale('Very widespread');
                else if (id == 'bar1') return colorScale('Fairly widespread');
                else if (id == 'bar2') return colorScale('Fairly rare');
                else if (id == 'bar3') return colorScale('Very rare');
                else return '#e9e9e9'
            } else {
                return '#e9e9e9';
            }
        })
        .on('mouseover', function(d) {
            if(validSelectedCountry) {
                // console.log(this);
                var fill = d3.select(this).style('fill');
                chartSVG.append('text').text(function() {
                    //check whether this is very hostile, fairly hostile...
                    if (fill == 'rgb(255, 80, 53)') return 'Very widespread';
                    else if (fill == 'rgb(255, 124, 104)') return 'Fairly widespread';
                    else if (fill == 'rgb(255, 168, 155)') return 'Fairly rare';
                    else if (fill == 'rgb(255, 195, 186)') return 'Very rare';
                    else return 'Not sure';
                })
                    .attr('class', 'hovertext')
                    .style('fill', function() {
                        return fill;
                    })
                    .attr('id', 'hovering2text')
                    .attr('x', function (data, i) {
                        return xOff + xScale(d[0]*100) + (xScale(d[1]*100) - xScale(d[0]*100))/2;
                    })
                    .attr('y', function(data, i) {
                        var identity;
                        if (i == 0) identity = "Lesbian";
                        else if (i == 1) identity = "Gay";
                        else if (i == 2) identity = "Bisexual women";
                        else if (i == 3) identity = "Bisexual men";
                        else if (i == 4) identity = "Transgender";
                        return chartPadding + yScale(identity) - 5;
                    })
                    .attr('pointer-events', 'none');
        }})
        .on('mouseout', function(d, i) {
            if(validSelectedCountry)
            d3.select('#hovering2text').remove();
        });

}

function initializeBarChart() {
    // clearing
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    chartSVG.append('text')
        .text('No selected country')
        .attr('class', 'subtitle')
        .attr('x', titlePadding)
        .attr('y', titlePadding);
        

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

        // setting up scales
        xScale = d3.scaleLinear()
            .domain([0,100])
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
                return (xScale(d[1]*100) - xScale(d[0]*100));
            })
            .attr('height', barHeight)
            .attr('x', function (d, i) {
                return xOff + xScale(d[0]*100);
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
    selectedCountry = 0;
}

function blankBarChart() {
    // clearing
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // if country is selected, display blank chart
    if (selectedCountry != null) {

        chartSVG.append('text')
        .text(function(d, i) {
            if (validSelectedCountry) return selectedCountry + ' response breakdown';
            else if (selectedCountry) return selectedCountry + ' is not a member of the EU'
            else return 'No selected country';
        })
        .attr('class', 'subtitle')
        .attr('x', titlePadding)
        .attr('y', titlePadding);
        

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

        // setting up scales
        xScale = d3.scaleLinear()
            .domain([0,100])
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
                return (xScale(d[1]*100) - xScale(d[0]*100));
            })
            .attr('height', barHeight)
            .attr('x', function (d, i) {
                return xOff + xScale(d[0]*100);
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
}
