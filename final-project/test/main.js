var svg = d3.select('svg');
svg.append('g').attr('id', 'links')
svg.append('g').attr('id', 'nodes')

// width and height of map
let w = 800;
let h = 800;

const csv = []; // array that holds relevant questions from all countries and all identities
const countryScores = new Map(); // key: countryname, value: current (?) score
const countryPercentages = new Map(); // key: countryname, value: array of percentages to each answer, [0] is very widespread, [3] is very rare

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
        // var enter = svg.selectAll('svg')
        //     .data(json.features)
        //     .enter()
        //     .append('g');


        svg.selectAll('#links').data(json.features).enter().append('path')
            .attr('d', path)
            .attr('stroke', 'white')
            .attr('class', 'normalpath')
            .attr('stroke-width', 1.7)
            .attr('fill', function(d, i) {
                // conditional fill here https://www.color-hex.com/color-palette/1020309
                let obj = calculateScore(d.properties.NAME);
                if (obj.found) {
                    var s = obj.score;
                    if (s > 1000) { // best
                        return '#ffc3ba';
                    } else if (s > 900) {
                        return '#ffa89b';
                    } else if (s > -100) {
                        return '#ff7c68'
                    } else { // worst
                        return '#ff5035';
                    }
                } else {
                    return '#e9e9e9'
                }
            })
            .on('mouseover', function(d) {
                // d3.select(this).attr('class', 'hoverpath');
                // svg.append('select').
                
                // ;
                // clone_d3_selection()
                //console.log('hi');
                svg.selectAll('#links').append('path')
                .attr('d', path)
                .attr('id', 'pathSelection')
                .attr('class', 'hoverpath')
                .attr('stroke', 'lightgrey')
                .attr('stroke-width', 1.7)
                // .attr('fill', 'black')
            })
            .on('mouseout', function(d) {
                //console.log("bye");
                svg.select('#pathSelection').remove();                
            });

        svg.selectAll('#nodes').data(json.features).enter().append('text')
            .attr('x', function(d) {
                return path.centroid(d)[0];
            })
            .attr('y', function(d) {
                return path.centroid(d)[1];
            })
            .text(function(d, i) {
                return d.properties.NAME;
            })
            .attr('class', 'countryname');
    });
});

function calculateScore(countryName) {
    var score;
    if (countryScores.has(countryName)) {
        score = Number(countryScores.get(countryName));
    } else {
        score = 0;
    }
    var found = false;

    for (let i = 0; i < csv.length; i++) {
        if (csv[i].CountryCode == countryName) {
            found = true;
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
    countryScores.set(countryName, score);
    return {score: score, found: found};
}

function clone_d3_selection(selection, i) {
    // Assume the selection contains only one object, or just work
    // on the first object. 'i' is an index to add to the id of the
    // newly cloned DOM element.
    var attr = selection.node().attributes;
    var length = attr.length;
    var node_name = selection.property("nodeName");
    var parent = d3.select(selection.node().parentNode);
    var cloned = parent.append(node_name)
        .attr("id", selection.attr("id") + i);
    for (var j = 0; j < length; j++) { // Iterate on attributes and skip on "id"
        if (attr[j].nodeName == "id") continue;
        cloned.attr(attr[j].name,attr[j].value);
    }
    return cloned;
}