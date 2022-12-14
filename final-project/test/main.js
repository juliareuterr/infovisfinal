var topSVG = d3.select('#top');
var mapSVG = d3.select('#map');
var chartSVG = d3.select('#chart');
var bottomSVG = d3.select('#bottom');

// ---- SVG constants ----
// width and height of top svg
const topSVGwidth = 1350;
const topSVGheight = 200;
// width and height of identities svg
const bottomSVGwidth = 650;
const bottomSVGheight = 150;
// width and height of chart svg
const chartSVGwidth = 650;
const chartSVGheight = 450;
// width and height of map svg
const w = 900;
const h = 800;

// ---- Chart constants ----
// width and height of chart
const chartWidth = 350;
const chartHeight = 300;
// horizontal offset for bars
const xOff = (chartSVGwidth - chartWidth) / 2;
// height of each bar
const barHeight = 50;
// padding around chart
const chartPadding = 75;
const titlePadding = 50;
const buttonBorder = 20;

// ---- Chart variables ----
// axes of chart
var xAxis, yAxis;
var xScale, yScale;
// currently selected country
var selectedCountry = null;
// whether current country is in the EU
var validSelectedCountry = false;
// possible answers
const answers = ['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Don`t know'];
// possible colors
const colors = ['#ff3010','#ff5f47','#fc9080','#ffd2cb', '#e1d1d1', '#e9e9e9']
// color scale
var colorScale = d3.scaleOrdinal().domain(answers).range(colors);

// ---- Data variables ----
// csv filtered by selected country
var countryCSV;
// array that holds relevant questions from all countries and all identities
const csv = [];
// key: countryname, value: current score
const countryScores = new Map();

// ---- Button variables ----
// possible questions
const buttonsText = ['Offensive language from politicans', 'Casual jokes', 'Expressions of hatred and aversion', 'Assaults and harrassment'];
// width of question buttons
const buttonsWidth = [];
// x position of question buttons
const rectX = [];
// map containing status of question buttons
const selectedButtons = new Map();
// question buttons
var button0;
var button1;
var button2;
var button3;
// possible identities
const idenButtonsText = ['Lesbian', 'Gay', 'Bisexual women', 'Bisexual men', 'Transgender'];
// width of identity buttons
const idenButtonsWidth = [];
// x position of identity buttons
const idenRectX = [];
// map containing status of identity buttons
const selectedIdenButtons = new Map();
// identity buttons 
var idenButton0;
var idenButton1;
var idenButton2;
var idenButton3;
var idenButton4;

// --- Setting up SVGs ---
// setting up title in top SVG
topSVG.append('text')
    .text('Hostility Towards LGBT People in the EU')
    .attr('class', 'title')
    .attr('x', titlePadding)
    .attr('y', titlePadding);

// setting up question in top SVG
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

// all question buttons are unselected by default
for (let i = 0; i < 4; i++) {
    selectedButtons.set(i, false);
}

// entering question buttons
var questionButtons = topSVG.selectAll('rect')
    .data(buttonsText)
    .enter();

// appending question buttons rect and text
questionButtons.append('rect')
    .attr('id', function(d, i) {return 'rect' + i;})
    .attr('class', 'qbutton')
    .attr('y', titlePadding*7/3)
    .attr('rx', 20)
    .attr('ry', 20);
questionButtons.append('text')
    .text(function(d, i) {return buttonsText[i];})
    .attr('class', 'qtext')
    .attr('y', titlePadding*7/3 + 25)
    .each(function(d, i) { buttonsWidth[i] = this.getComputedTextLength()});

// updating rect width and position to match text size
questionButtons.selectAll('rect')
    .attr('width', function(d, i) { return buttonsWidth[i] + buttonBorder; })
    .attr('x', function(d, i) {
        if (i == 0) rectX[i] = titlePadding;
        else rectX[i] = (buttonBorder*2 + Number(d3.select(this.previousSibling).attr('x')) + Number(buttonsWidth[i-1]));
        return rectX[i];
    })
    // adding click functionality to toggle buttons and update variables/charts
    .on('click', function(d, i) {
        // flip button
        if (selectedButtons.get(i)) {
            selectedButtons.set(i, false);
            topSVG.select('#rect' + i).attr('class', 'qbutton');
        } else {
            selectedButtons.set(i, true);
            topSVG.select('#rect' + i).attr('class', 'qbuttonpressed');
        }

        // array that holds relevant question for selected country and all identities
        countryCSV = [];
        
        // update button variables
        button0 = selectedButtons.get(0);
        button1 = selectedButtons.get(1);
        button2 = selectedButtons.get(2);
        button3 = selectedButtons.get(3);

        // updating countryCSV, iterate through all data entries
        for (let i = 0; i < csv.length; i++) {
            // if row matches selected country
            if ((csv[i].CountryCode == selectedCountry)) {
                // if row matches questions selected, add to countryCSV
                if ((csv[i].question_code == "b1_a" && button0)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_b" && button1)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_c" && button2)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_d" && button3)) countryCSV.push(csv[i]);
            }
        }

        // update coloring of map to reflect selected buttons
        updateCountries();

        // update bar chart
        if (countryCSV.length > 0) {
            updateBarChart(countryCSV);
        } else {
            blankBarChart();
        }    
    });

// update text x to start where button does
questionButtons.selectAll('.qtext')
    .attr('x', function(d, i) { 
        if (i==0) return titlePadding + buttonsWidth[i]/2 + buttonBorder/2;
        else return (rectX[i] + buttonsWidth[i]/2 + buttonBorder/2);
    });

// setting up title in bottom SVG
bottomSVG.append('text')
    .text('Identity of Respondents')
    .attr('class', 'subtitle')
    .attr('x', titlePadding)
    .attr('y', titlePadding);

// all identity buttons are selected by default
for (let i = 0; i < 5; i++) {
    selectedIdenButtons.set(i, true);
}

// entering identity buttons
var idenButtons = bottomSVG.selectAll('rect')
    .data(idenButtonsText)
    .enter();

// appending identity buttons rect and text
idenButtons.append('rect')
    .attr('id', function(d, i) {return 'rect' + i;})
    .attr('class', 'qbuttonpressed')
    .attr('y', titlePadding*4/3)
    .attr('rx', 20)
    .attr('ry', 20);
idenButtons.append('text')
    .text(function(d, i) {return idenButtonsText[i];})
    .attr('class', 'qtext')
    .attr('y', titlePadding*4/3 + 25)
    .each(function(d, i) { idenButtonsWidth[i] = this.getComputedTextLength()});

// updating rect width and position to match text size
idenButtons.selectAll('rect')
    .attr('width', function(d, i) { return idenButtonsWidth[i] + buttonBorder; })
    .attr('x', function(d, i) {
        if (i == 0) idenRectX[i] = titlePadding;
        else idenRectX[i] = (buttonBorder*2 + Number(d3.select(this.previousSibling).attr('x')) + Number(idenButtonsWidth[i-1]));
        return idenRectX[i];
    })
    // adding click functionality to toggle buttons and update variables/charts
    .on('click', function(d, i) {
        // flip button
        if (selectedIdenButtons.get(i)) {
            selectedIdenButtons.set(i, false);
            bottomSVG.select('#rect' + i).attr('class', 'qbutton');
        } else {
            selectedIdenButtons.set(i, true);
            bottomSVG.select('#rect' + i).attr('class', 'qbuttonpressed');
        }

        // array that holds relevant question for selected country and all identities
        countryCSV = [];
        
        // update button variables
        idenButton0 = selectedIdenButtons.get(0);
        idenButton1 = selectedIdenButtons.get(1);
        idenButton2 = selectedIdenButtons.get(2);
        idenButton3 = selectedIdenButtons.get(3);
        idenButton4 = selectedIdenButtons.get(4);

        // updating countryCSV, iterate through all data entries
        for (let i = 0; i < csv.length; i++) {
            // if row matches selected country
            if ((csv[i].CountryCode == selectedCountry)) {
                // if row matches questions selected, add to countryCSV
                if ((csv[i].question_code == "b1_a" && button0)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_b" && button1)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_c" && button2)) countryCSV.push(csv[i]);
                if ((csv[i].question_code == "b1_d" && button3)) countryCSV.push(csv[i]);
            }
        }

        // update coloring of map to reflect selected identity buttons
        updateCountries();
        
        // update bar chart
        if (countryCSV.length > 0) {
            updateBarChart(countryCSV);
        } else {
            blankBarChart();
        }   
    });

// update text x to start where button does
idenButtons.selectAll('.qtext')
    .attr('x', function(d, i) { 
        if (i==0) return titlePadding + idenButtonsWidth[i]/2 + buttonBorder/2;
        else return (idenRectX[i] + idenButtonsWidth[i]/2 + buttonBorder/2);
    });

// add key to map SVG
var keyg = mapSVG.append('g');
// add key title
keyg.append('text')
    .attr('class', 'subtitle')
    .text('Relative Hostility')
    .attr('transform', 'translate(710, 154)');
// enter categories
var gEnter = keyg.selectAll('g')
    .data(['Very widespread', 'Fairly widespread', 'Fairly rare', 'Very rare', 'Unsure'])
    .enter()
    .append('g');
// for each category, add color rect and label
gEnter.append('rect')
    .attr('class', 'keyrect')
    .attr('fill', function(d, i) { return ((i < 4) ? colorScale(d) : (i < 5) ? colorScale('Don`t know') : '#e9e9e9'); })
    .attr('width', 15)
    .attr('height', 15)
    .attr('x', 710)
    .attr('y', function(d, i) { return 175 + i*30; });
gEnter.append('text')
    .attr('class', 'keylabel')
    .text(function(d, i) {return d;})
    .attr('x', 740)
    .attr('y', function(d, i) { return 187 + i*30; });

var selectedg = keyg.select('g');
selectedg.append('rect')
        .attr('fill', function(d, i) { return ('#e9e9e9'); })
        .attr('width', 15)
        .attr('height', 15)
        .attr('x', 710)
        .attr('y', function(d, i) { return 175 + 5*30; });

selectedg.append('text')
    .attr('class', 'keylabel')
    .text('No data / not selected')
    .attr('x', 740)
    .attr('y', function(d, i) { return 187 + 5*30; });

// loading CSV
d3.csv('LGBT_Survey_DailyLife.csv').then(function(dataset) {
    // defining map projection
    let projection = d3.geoConicConformal()
        .center([15, 54])
        .translate([(w / 2) + 20, (h / 2) + 45])
        .scale(1000);

    // defining path generator for geoJSON
    let path = d3.geoPath()
        .projection(projection);

    // loading in geoJSON data
    d3.json('europeMed.json').then(function(json) {
        // initializing data based on the dataset and json
        initializeData(dataset, json);

        // binding data and creating one g per geojson feature
        var enter = mapSVG.selectAll('g')
            .data(json.features)
            .enter()
            .append('g');

        // for each g, append the path (country shape)
        enter.append('path')
            .attr('d', path)
            .attr('class', 'normalpath')
            .attr('fill', function(d) {
                // check score of country and whether it was found in the dataset
                if (updateScore(d.properties.NAME).found) {
                    // bins: min, min+(max-min)/4, min+(max-min)*2/4, min+(max-min)*3/4 (up to max)
                    if (updateScore(d.properties.NAME).score < min + (diff/4)) { return colorScale('Very widespread'); }
                    else if (updateScore(d.properties.NAME).score < min + (diff/2)) { return colorScale('Fairly widespread'); }
                    else if (updateScore(d.properties.NAME).score < min + (diff*3/4)) { return colorScale('Fairly rare'); } 
                    else { return colorScale('Very rare'); }
                } else { return '#e9e9e9'; } // if it wasn't found, we don't have the data
            })
            .on('mouseover', function(d) {
                // if mouse is over path, display country name
                mapSVG.append('text')
                    .text(d.properties.NAME)
                    .attr('class', 'hovertext')
                    .attr('id', 'hoveringtext')
                    .attr('x', function() { return path.centroid(d)[0]; })
                    .attr('y', function() { return path.centroid(d)[1]; })
                    .attr('pointer-events', 'none');
            })
            .on('mouseout', function() {
                // if mouse leaves path, remove country name
                d3.select('#hoveringtext').remove();
            })
            .on('click', function(d) {
                // if clicked on path, update selected country
                selectedCountry = d.properties.NAME;
                // check if country is valid ( == member of the EU)
                validSelectedCountry = false;
                for (let i = 0; i < csv.length; i++) {
                    if (csv[i].CountryCode == selectedCountry) {
                        validSelectedCountry = true;
                        break;
                    }
                }
                // remove previous selected country formatting and name
                d3.selectAll('.selectedpath').attr('class', 'normalpath');
                d3.select('#selectedtext').remove();
                // update new selected country formatting
                d3.select(this).attr('class', 'selectedpath');

                // add new country's name
                mapSVG.append('text').text(d.properties.NAME)
                    .attr('class', 'hovertext')
                    .attr('id', 'selectedtext')
                    .attr('x', function() { return path.centroid(d)[0]; })
                .attr('y', function() { return path.centroid(d)[1]; })
                .attr('pointer-events', 'none');

                // array that holds relevant question for selected country and all identities
                countryCSV = [];

                // updating countryCSV, iterate through all data entries
                for (let j = 0; j < csv.length; j++) {
                    // if row matches selected country
                    if ((csv[j].CountryCode == d.properties.NAME)) {
                        // if row matches questions selected, add to countryCSV
                        if ((csv[j].question_code == "b1_a" && button0)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_b" && button1)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_c" && button2)) countryCSV.push(csv[j]);
                        if ((csv[j].question_code == "b1_d" && button3)) countryCSV.push(csv[j]);
                    }
                }

                // update bar chart for selected country
                if (countryCSV.length > 0 && validSelectedCountry) {
                    updateBarChart(countryCSV);
                } else {
                    blankBarChart();
                }
            });
    });
});

// takes in index of csv, returns whether or not that index contains a selected identity
function filterIdentities(i) {
    if (csv[i].subset == "Lesbian" && idenButton0) return true;
    if (csv[i].subset == "Gay" && idenButton1) return true;
    if (csv[i].subset == "Bisexual women" && idenButton2) return true;
    if (csv[i].subset == "Bisexual men" && idenButton3) return true;
    if (csv[i].subset == "Transgender" && idenButton4) return true;
    return false;
}

function initializeData(dataset, json) {
    // only add questions being used to the csv
    for (let i = 0; i < dataset.length; ++i) {
        if (dataset[i].question_code == 'b1_a' || dataset[i].question_code == 'b1_b' // b1_a is offensive language by politicians, b1_b is casual jokes
        || dataset[i].question_code == 'b1_c' || dataset[i].question_code == 'b1_d') { // b1_c is expressions of hatred and aversion, b1_d is assaults and harrassment
            csv.push(dataset[i]);
        }
    }
    // initialize identity buttons
    idenButton0 = selectedIdenButtons.get(0);
    idenButton1 = selectedIdenButtons.get(1);
    idenButton2 = selectedIdenButtons.get(2);
    idenButton3 = selectedIdenButtons.get(3);
    idenButton4 = selectedIdenButtons.get(4);
    // initialize question buttons
    button0 = selectedButtons.get(0);
    button1 = selectedButtons.get(1);
    button2 = selectedButtons.get(2);
    button3 = selectedButtons.get(3);
    // initialize scores for each country to 0
    initializeScores();
    // initialize bar chart
    initializeBarChart();
}

function initializeScores() {
    // loop through csv
    for (let i = 0; i < csv.length; i++) {
        // set score to 0
        countryScores.set(csv[i].CountryCode, 0);
    }
}

function updateCountries() {
    // reset all scores to 0
    initializeScores();
    // update score for each country
    mapSVG.selectAll('g')
        .selectAll('path')
        .each(function(d, i) {
            updateScore(d.properties.NAME);
        });
    
    // gather all valid current scores
    var currScores = [];
    for (let [key, value] of countryScores) {
        if (value != null && value != 0 && !isNaN(value)) {
            currScores.push(value);
        }
    }
    // find min score, max score, and difference between both
    var min = Math.min(...currScores);
    var max = Math.max(...currScores);
    var diff = max-min;

    // update coloring of map
    mapSVG.selectAll('g')
        .selectAll('path')
        .attr('fill', function(d) {
            // check score of country and whether it was found in the dataset
            if (updateScore(d.properties.NAME).found) {
                // bins: min, min+(max-min)/4, min+(max-min)*2/4, min+(max-min)*3/4 (up to max)
                if (updateScore(d.properties.NAME).score < min + (diff/4)) { return colorScale('Very widespread'); }
                else if (updateScore(d.properties.NAME).score < min + (diff/2)) { return colorScale('Fairly widespread'); }
                else if (updateScore(d.properties.NAME).score < min + (diff*3/4)) { return colorScale('Fairly rare'); } 
                else { return colorScale('Very rare'); }
            } else { return '#e9e9e9'; } // if it wasn't found, we don't have the data
        });
}

function updateScore(countryName) {
    var score = 0;
    var times = 0;
    var found = false;
    for (let i = 0; i < csv.length; i++) {
        // if correct country and if the answer is for the selected questions (from buttons) and if answer is a selected identity
        if (csv[i].CountryCode == countryName && ((button0 && csv[i].question_code == "b1_a") || (button1 && csv[i].question_code == "b1_b")
        || (button2 && csv[i].question_code == "b1_c") || (button3 && csv[i].question_code == "b1_d")) && (filterIdentities(i))) {
            found = true;
            // increment score and how many we found
            if (csv[i].answer == 'Very widespread') {score += Number(csv[i].percentage); times+=1;}
            else if (csv[i].answer == 'Fairly widespread') {score += (2*Number(csv[i].percentage)); times+=1;}
            else if (csv[i].answer == 'Fairly rare') {score += (3*Number(csv[i].percentage)); times+=1;}
            else if (csv[i].answer == 'Very rare') {score += (4*Number(csv[i].percentage)); times+=1;}
            // if (csv[i].answer == 'Don`t know') score += Number(csv[i].percentage);
        }
    }
    // set score, normalized
    countryScores.set(countryName, score/times);
    return {score: score/times, found: found, times: times};
}

function updateBarChart(countryCSV) {
    // clear old bar chart
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // add title (country name)
    chartSVG.append('text')
        .text(selectedCountry + ' Response Breakdown')
        .attr('class', 'subtitle')
        .attr('x', titlePadding)
        .attr('y', titlePadding);

    // set up data array
    var data = [
        {identity: 'Lesbian', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Gay', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Bisexual women', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Bisexual men', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0},
        {identity: 'Transgender', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 0} 
    ];

    // update data array for buttons selected
    // iterate through csv for selected country
    for (let i = 0; i < countryCSV.length; i++) {
        let index = 5;
        // index keeps track of which identity to add to in data array
        if (countryCSV[i].subset == 'Lesbian') index = 0;
        if (countryCSV[i].subset == 'Gay') index = 1;
        if (countryCSV[i].subset == 'Bisexual women') index = 2;
        if (countryCSV[i].subset == 'Bisexual men') index = 3;
        if (countryCSV[i].subset == 'Transgender') index = 4;
        // if it's a selected question, add % to the answer variable for the correct identity in data array
        if ((button0 && countryCSV[i].question_code == "b1_a") || (button1 && countryCSV[i].question_code == "b1_b") || (button2 && countryCSV[i].question_code == "b1_c") || (button3 && countryCSV[i].question_code == "b1_d")) {
            if (countryCSV[i].answer == 'Very widespread') data[index].veryWidespread += Number(countryCSV[i].percentage); 
            else if (countryCSV[i].answer == 'Fairly widespread') data[index].fairlyWidespread += Number(countryCSV[i].percentage);
            else if (countryCSV[i].answer == 'Fairly rare') data[index].fairlyRare += Number(countryCSV[i].percentage); 
            else if (countryCSV[i].answer == 'Very rare') data[index].veryRare += Number(countryCSV[i].percentage);
            else if (countryCSV[i].answer == 'Don`t know') data[index].idk += Number(countryCSV[i].percentage);
        }
    }

    // normalize data
    for (let i = 0; i < data.length; i++) {
        var total = data[i].veryWidespread + data[i].fairlyWidespread + data[i].fairlyRare + data[i].veryRare + data[i].idk;
        data[i].veryWidespread /= total;
        data[i].fairlyWidespread /= total;
        data[i].fairlyRare /= total;
        data[i].veryRare /= total;
        data[i].idk /= total;
    }

    // set up stack method and stack data
	var stack = d3.stack().keys(['veryWidespread', 'fairlyWidespread', 'fairlyRare', 'veryRare', 'idk']);
    var series = stack(data);
        
    // set up scales and axes
    // x axis
    var formatPercent = d3.format(".0%");
    xScale = d3.scaleLinear()
        .domain([0,1])
        .range([0, chartWidth]); 
    xAxis = d3.axisBottom(xScale).tickFormat(formatPercent);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() { return "translate(" + (chartSVGwidth - chartWidth) / 2 + "," + (chartSVGheight - chartPadding) + ")"; })
        .call(xAxis);
    // y axis
    yScale = d3.scaleBand()
        .domain(["Lesbian", "Gay", "Bisexual women", "Bisexual men", "Transgender"])
        .range([0, chartHeight]);
    yAxis = d3.axisLeft(yScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() { return "translate(" + (chartSVGwidth - chartWidth) / 2 + "," + (chartPadding) + ")"; })
        .call(yAxis);

    // add bars
    // select all elements classed bar
    var barElements = chartSVG.selectAll('.bar').data(series);
    // create g for each answer and append to bar
    var barEnter = barElements.enter()
        .append('g')
        .attr('id', function(d, i) { return 'bar'+i; })
        .attr('class', 'bar');
    // add rectangles for each answer
    barEnter.selectAll('rect')
        .data(function(d) { return d; })
		.enter()
        .append('rect')
        .attr('width', function(d, i) { return (xScale(d[1]) - xScale(d[0])); })
        .attr('height', barHeight)
        .attr('x', function (d, i) { return xOff + xScale(d[0]); })
        .attr('y', function(d, i) {
            if (i == 0) return chartPadding + yScale('Lesbian');
            else if (i == 1) return chartPadding + yScale('Gay');
            else if (i == 2) return chartPadding + yScale('Bisexual women');
            else if (i == 3) return chartPadding + yScale('Bisexual men');
            else if (i == 4) return chartPadding + yScale('Transgender');
        })
        .style('fill', function(d, i) {
            // check if button for that identity is selected before filling
            if ((i==0 && idenButton0) || (i==1 && idenButton1) || (i==2 && idenButton2) || (i==3 && idenButton3) || (i==4 && idenButton4)) {
                if (d3.select(this.parentNode).attr('id') == 'bar0') return colorScale('Very widespread');
                else if (d3.select(this.parentNode).attr('id') == 'bar1') return colorScale('Fairly widespread');
                else if (d3.select(this.parentNode).attr('id') == 'bar2') return colorScale('Fairly rare');
                else if (d3.select(this.parentNode).attr('id') == 'bar3') return colorScale('Very rare');
                else return '#e1d1d1'
            } else {
                // identity not selected, fill with grey
                return '#e9e9e9';
            }
        })
        .on('mouseover', function(d) {
            // if mouse over the bar, show legend
            if (validSelectedCountry) {
                var fill = d3.select(this).style('fill');
                chartSVG.append('text')
                .text(function() {
                    // checking text to display based on color of rect
                    if (fill == 'rgb(255, 48, 16)') return 'Very widespread';
                    else if (fill == 'rgb(255, 95, 71)') return 'Fairly widespread';
                    else if (fill == 'rgb(252, 144, 128)') return 'Fairly rare';
                    else if (fill == 'rgb(255, 210, 203)') return 'Very rare';
                    else if (fill == 'rgb(225, 209, 209)') return 'Not sure';
                })
                .attr('class', 'hovertext')
                .attr('id', 'hovering2text')
                .style('fill', function() { return fill; })
                .attr('x', function () { return xOff + xScale(d[0]) + (xScale(d[1]) - xScale(d[0]))/2; })
                .attr('y', function(data, i) {
                    if (i == 0) return chartPadding + yScale('Lesbian') - 5;
                    else if (i == 1) return chartPadding + yScale('Gay') - 5;
                    else if (i == 2) return chartPadding + yScale('Bisexual women') - 5;
                    else if (i == 3) return chartPadding + yScale('Bisexual men') - 5;
                    else if (i == 4) return chartPadding + yScale('Transgender') - 5;
                })
                .attr('pointer-events', 'none');
        }})
        .on('mouseout', function(d, i) {
            // if mouse leaving bar, remove legend
            if (validSelectedCountry) d3.select('#hovering2text').remove();
        });
}

function initializeBarChart() {
    // clear old bar chart (just in case!)
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // add title (country name)
    chartSVG.append('text')
        .text('No selected country')
        .attr('class', 'subtitle')
        .attr('x', titlePadding)
        .attr('y', titlePadding);
        

    // set up data array
    var data = [
        {identity: 'Lesbian', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Gay', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Bisexual women', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Bisexual men', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
        {identity: 'Transgender', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1} 
    ];
    // set up stack method and stack data
    var stack = d3.stack()
        .keys(['veryWidespread', 'fairlyWidespread', 'fairlyRare', 'veryRare', 'idk']);
    var series = stack(data);

    // set up scales and axes
    // x axis
    var formatPercent = d3.format(".0%");
    xScale = d3.scaleLinear()
        .domain([0,1])
        .range([0, chartWidth]); 
    xAxis = d3.axisBottom(xScale).tickFormat(formatPercent);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() { return "translate(" + (chartSVGwidth - chartWidth) / 2 + "," + (chartSVGheight - chartPadding) + ")"; })
        .call(xAxis);
    // y axis
    yScale = d3.scaleBand()
        .domain(["Lesbian", "Gay", "Bisexual women", "Bisexual men", "Transgender"])
        .range([0, chartHeight]);
    yAxis = d3.axisLeft(yScale);
    chartSVG.append('g')
        .attr('class', 'axis')
        .attr("transform", function() { return "translate(" + (chartSVGwidth - chartWidth) / 2 + "," + (chartPadding) + ")"; })
        .call(yAxis);

    // add bars
    // select all elements classed bar
    var barElements = chartSVG.selectAll('.bar')
        .data(series);
    // create g for each answer and append to bar
    var barEnter = barElements.enter()
        .append('g')
        .attr('class', 'bar')
        .style('fill', function(d) {return '#e9e9e9'});
    // add rectangles for each answer
    barEnter.selectAll('rect')
        .data(function(d) { return d; })
        .enter()
        .append('rect')
        .attr('width', function(d) { return (xScale(d[1]) - xScale(d[0])); })
        .attr('height', barHeight)
        .attr('x', function (d) { return xOff + xScale(d[0]); })
        .attr('y', function(d, i) {
            if (i == 0) return chartPadding + yScale('Lesbian');
            else if (i == 1) return chartPadding + yScale('Gay');
            else if (i == 2) return chartPadding + yScale('Bisexual women');
            else if (i == 3) return chartPadding + yScale('Bisexual men');
            else if (i == 4) return chartPadding + yScale('Transgender');
        });

    // initialize selected country
    selectedCountry = 0;
}

function blankBarChart() {
    // clear old bar chart
    chartSVG.selectAll('text').remove();
    chartSVG.selectAll('g').remove();

    // if country is selected, display blank chart
    if (selectedCountry != null) {
        // add title (country name)
        chartSVG.append('text')
        .text(function(d, i) {
            if (validSelectedCountry) return selectedCountry + ' Response Breakdown';
            else if (selectedCountry) return selectedCountry + ' is not a member of the EU'
            else return 'No selected country';
        })
        .attr('class', 'subtitle')
        .attr('x', titlePadding)
        .attr('y', titlePadding);
        
        // set up data array
        var data = [
            {identity: 'Lesbian', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
            {identity: 'Gay', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
            {identity: 'Bisexual women', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
            {identity: 'Bisexual men', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1},
            {identity: 'Transgender', veryWidespread: 0, fairlyWidespread: 0, fairlyRare: 0, veryRare: 0, idk: 1} 
        ];
        // set up stack method and stack data
        var stack = d3.stack()
            .keys(['veryWidespread', 'fairlyWidespread', 'fairlyRare', 'veryRare', 'idk']);
        var series = stack(data);

        // set up scales and axes
        // x axis
        var formatPercent = d3.format(".0%");
        xScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, chartWidth]); 
        xAxis = d3.axisBottom(xScale).tickFormat(formatPercent);
        chartSVG.append('g')
            .attr('class', 'axis')
            .attr("transform", function() {
                return "translate(" + (chartSVGwidth - chartWidth) / 2
                + "," + (chartSVGheight - chartPadding) + ")"
            })
            .call(xAxis);
        // y axis
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

        // add bars
        // select all elements classed bar
        var barElements = chartSVG.selectAll('.bar')
            .data(series);
        // create g for each answer and append to bar
        var barEnter = barElements.enter()
            .append('g')
            .attr('class', 'bar')
            .style('fill', function(d) {return '#e9e9e9'});

        // add rectangles for each answer
        barEnter.selectAll('rect')
            .data(function(d) { return d; })
            .enter()
            .append('rect')
            .attr('width', function(d) { return (xScale(d[1]) - xScale(d[0])); })
            .attr('height', barHeight)
            .attr('x', function (d) { return xOff + xScale(d[0]); })
            .attr('y', function(d, i) {
                if (i == 0) return chartPadding + yScale('Lesbian');
                else if (i == 1) return chartPadding + yScale('Gay');
                else if (i == 2) return chartPadding + yScale('Bisexual women');
                else if (i == 3) return chartPadding + yScale('Bisexual men');
                else if (i == 4) return chartPadding + yScale('Transgender');
            });
    } else {
        initializeBarChart();
    }
}
