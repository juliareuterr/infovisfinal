
//TAKEN FROM INTERNET

//Width and height
let width = 1000;
let height = 800;

//Define map projection
let projection = d3.geo.mercator()
.center([132, -28])
.translate([width / 2, height / 2])
.scale(1000);

//Define path generator
let path = d3.geo.path()
.projection(projection);

//append svg to map div
var svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

//Load in GeoJSON data
d3.json("aust.json", (json) => {

//Binding data and creating one path per GeoJSON feature
svg.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "dimgray")
    .attr("fill", (d, i) => { return color(i) });

});