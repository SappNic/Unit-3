// begin script when window loads
window.onload = setMap;

// Example 1.3 line 4...set up choropleth map
function setMap() {
    // map frame dimensions
    var width = 960,
        height = 500; 

    // create new svg container for the map
    var map = d3
        .select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    // create Albers equal area conic projection centered on the US
    var projection = d3
        .geoAlbersUsa() // Changed to use the Albers USA projection
        .translate([width / 2, height / 2])
        .scale([1000]); 

    var path = d3.geoPath().projection(projection);

    // use Promise.all to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/Tornado.csv"), 
        d3.json("data/Activity9shp.topojson"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            us = data[1];

        // translate US TopoJSON
        var usStates = topojson.feature(us, us.objects.Activity9shp).features; 

        var graticule = d3.geoGraticule().step([5, 5]); // place graticule lines every 5 degrees of longitude and latitude

        // create graticule background
        var gratBackground = map
            .append("path")
            .datum(graticule.outline()) // bind graticule background
            .attr("class", "gratBackground") // assign class for styling
            .attr("d", path); // project graticule

        // create graticule lines
        var gratLines = map
            .selectAll(".gratLines") // select graticule elements that will be created
            .data(graticule.lines()) // bind graticule lines to each element to be created
            .enter() // create an element for each datum
            .append("path") // append each element to the svg as a path element
            .attr("class", "gratLines") // assign class for styling
            .attr("d", path); // project graticule lines

        // add US states to map
        var states = map
            .selectAll(".states")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.name;
            })
            .attr("d", path);
    }
}
