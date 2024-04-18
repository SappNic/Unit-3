(function () {
    var attrArray = ["2012", "2014", "2016", "2018", "2020", "Change from 2012-2020"];
    var expressed = attrArray[0]; // Initially show data for 2012

    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    window.onload = setMap;

    function setMap() {
        var width = 780,
            height = 500;

        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        var projection = d3.geoAlbersUsa()
            .scale(1070)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);

        var promises = [
            d3.csv("data/fertility_rates.csv"),
            d3.json("data/States1.topojson")
        ];

        Promise.all(promises).then(callback);

        function callback(data) {
            var csvData = data[0],
                usStates = data[1];

            var usStatesGeo = topojson.feature(usStates, usStates.objects.cb_2018_us_state_20m);
            usStatesGeo.features = joinData(usStatesGeo.features, csvData);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(usStatesGeo.features, map, path, colorScale);
            createDropdown(csvData);
            setChart(csvData, colorScale);
            addDescription();
            createLegend(colorScale);
        };
    }

    function addDescription() {
        var descriptionText = "This is a map depicting the fertility rate per 1,000 women aged 15-44 for each state from 2012-2020. " +
                              "The graph is a good way to show the decrease from 2012-2020. " +
                              "Source: <a href='https://www.marchofdimes.org/peristats/data?reg=01&top=2&stop=1&lev=1&slev=4&obj=1&sreg=56&creg' target='_blank'>March of Dimes</a>";

        d3.select("body")
            .append("div")
            .attr("class", "map-description")
            .html(descriptionText)
            .style("position", "absolute")
            .style("top", "550px")
            .style("left", "10px")
            .style("font-size", "14px")
            .style("width", "780px");
    }

    function createLegend(colorScale) {
        var legend = d3.select("body").append("div")
            .attr("class", "legend")
            .style("position", "absolute")
            .style("top", "620px")
            .style("left", "800px")
            .style("font-size", "14px");

        var legendItemSize = 20;
        var legendSpacing = 4;

        colorScale.range().forEach(function(color, index) {
            var range = colorScale.invertExtent(color);
            var legendItem = legend.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-bottom", legendSpacing + "px");

            legendItem.append("div")
                .style("width", legendItemSize + "px")
                .style("height", legendItemSize + "px")
                .style("background-color", color);

            legendItem.append("span")
                .style("margin-left", "5px")
                .text(`${range[0].toFixed(2)} - ${range[1].toFixed(2)}`);
        });
    }

    function createDropdown(csvData) {
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function() {
                changeAttribute(this.value, csvData);
            });

        dropdown.selectAll("option")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d) { return d; })
            .text(function(d) { return d; });
    }

    function changeAttribute(attribute, csvData) {
        expressed = attribute;
        var colorScale = makeColorScale(csvData);
        updateChart(csvData, colorScale);
    }

    function joinData(geojsonFeatures, csvData) {
        for (var i = 0; i < csvData.length; i++) {
            var csvState = csvData[i];
            var csvKey = csvState.NAME;

            for (var a = 0; a < geojsonFeatures.length; a++) {
                var geojsonProps = geojsonFeatures[a].properties;
                var geojsonKey = geojsonProps.NAME;

                if (geojsonKey === csvKey) {
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvState[attr]);
                        geojsonProps[attr] = val;
                    });
                }
            }
        }
        return geojsonFeatures;
    }

    function makeColorScale(data) {
        var colorClasses = [
            "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"
        ];

        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        }

        colorScale.domain(domainArray);
        return colorScale;
    }

    function setEnumerationUnits(geojsonFeatures, map, path, colorScale) {
        var states = map.selectAll(".states")
            .data(geojsonFeatures)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.NAME.replace(/ /g, "_");
            })
            .attr("d", path)
            .style("fill", function (d) {
                var value = d.properties[expressed];
                return value ? colorScale(value) : "#ccc";
            })
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d.properties.NAME + "<br/>" + expressed + ": " + d.properties[expressed])
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");

                d3.select(this)
                    .style("stroke", "orange")
                    .style("stroke-width", "2px");

                d3.selectAll(".bar." + d.properties.NAME.replace(/ /g, "_"))
                    .style("fill", "orange");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                d3.select(this)
                    .style("stroke", "none");

                d3.selectAll(".bar." + d.properties.NAME.replace(/ /g, "_"))
                    .style("fill", function(d) {
                    return colorScale(d[expressed]);
                });
            });
    }

    function setChart(csvData, colorScale) {
        var yScale = updateYScale(csvData);

        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        var yAxis = d3.axisLeft()
            .scale(yScale);

        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        chart.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("class", "chartTitle")
            .text("Fertility Rate: " + expressed);

        updateChart(csvData, colorScale);  // Initial call to sort and display bars
    }

    function updateYScale(csvData) {
        return d3.scaleLinear()
            .range([463, 0])
            .domain([0, d3.max(csvData, function(d) { return parseFloat(d[expressed]); })]);
    }

    function updateChart(csvData, colorScale) {
        var chart = d3.select(".chart");
        var yScale = updateYScale(csvData);

        // Call to update the chart title
        updateChartTitle();

        var sortedData = csvData.sort(function(a, b) {
            return b[expressed] - a[expressed];
        });

        var bars = chart.selectAll(".bar")
            .data(sortedData, function(d) { return d.NAME; });

        bars.enter()
            .append("rect")
            .attr("class", function(d) {
                return "bar " + d.NAME.replace(/ /g, "_");
            })
            .merge(bars) // Merge new and existing bars
            .transition() // Add smooth transition
            .duration(500)
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function (d, i) {
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function (d) {
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d) {
                return yScale(parseFloat(d[expressed]));
            })
            .style("fill", function (d) {
                return colorScale(d[expressed]);
            });

        bars.exit().remove();

        var yAxis = d3.axisLeft()
            .scale(yScale);

        d3.select(".axis").transition().duration(500).call(yAxis);
    }

    // Function to update the chart title
    function updateChartTitle() {
        var chartTitle = d3.select(".chartTitle");
        chartTitle.text("Fertility Rate: " + expressed);
    }
})();
