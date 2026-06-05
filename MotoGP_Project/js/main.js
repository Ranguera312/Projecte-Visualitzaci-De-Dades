// ===============================
// GLOBAL STATE
// ===============================

let selectedYear = null;
let selectedCategory = null;

const tooltip = d3.select("#tooltip");

// dades globals (evita reload constant)
let DATA = {};

// ===============================
// LOAD DATA (només 1 cop)
// ===============================

Promise.all([
    d3.json("Json/timeline.json"),
    d3.json("Json/top_riders.json"),
    d3.json("Json/consistency.json"),
    d3.json("Json/manufacturers.json"),
    d3.json("Json/ClimateZone.json"),
    d3.json("Json/climate_specialists.json")
]).then(([timeline, riders, consistency, manufacturers, climateZone, specialists]) => {

    DATA = {
        timeline,
        riders,
        consistency,
        manufacturers,
        climateZone,
        specialists
    };

    initFilters();
    drawAll();
});

// ===============================
// FILTERS
// ===============================

function initFilters() {

    const years = [...new Set(DATA.timeline.map(d => d.year))];

    const seasonSelect = d3.select("#seasonFilter");

    seasonSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    selectedYear = years[0];

    updateCategoryFilter();

    seasonSelect
        .property("value", selectedYear)
        .on("change", function () {
            selectedYear = +this.value;

            updateCategoryFilter();
            drawAll();
        });

    d3.select("#categoryFilter")
        .on("change", function () {
            selectedCategory = this.value;
            drawAll();
        });
}

// categories depenen de l'any
function updateCategoryFilter() {

    const categories = [...new Set(
        DATA.timeline
            .filter(d => d.year === selectedYear)
            .map(d => d.category)
    )];

    const categorySelect = d3.select("#categoryFilter");

    categorySelect.selectAll("option").remove();

    categorySelect.selectAll("option")
        .data(categories)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    if (!categories.includes(selectedCategory)) {
        selectedCategory = categories[0];
    }

    categorySelect.property("value", selectedCategory);
}

// ===============================
// DRAW ALL
// ===============================

function drawAll() {

    d3.selectAll("svg").remove();

    drawTimeline(DATA.timeline);
    drawTopRiders(DATA.riders);
    drawConsistency(DATA.consistency);
    drawManufacturers(DATA.manufacturers);
    drawClimate(DATA.climateZone);
    drawClimateMasters(DATA.specialists);
    drawHallOfFame();
}

// ===============================
// SVG CREATOR
// ===============================

function createSVG(id) {

    const margin = { top: 40, right: 30, bottom: 60, left: 150 };

    const svg = d3.select(id).append("svg")
        .attr("width", 1000)
        .attr("height", 550);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return {
        svg,
        g,
        width: 1000 - margin.left - margin.right,
        height: 550 - margin.top - margin.bottom
    };
}

// ===============================
// AXES
// ===============================

function drawAxes(g, x, y, width, height, xlabel, ylabel) {

    g.selectAll("*").remove();

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    g.append("g")
        .call(d3.axisLeft(y).ticks(6));

    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text(xlabel)
        .attr("fill", "white");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -110)
        .attr("text-anchor", "middle")
        .text(ylabel)
        .attr("fill", "white");
}

// ===============================
// 1. TIMELINE
// ===============================

function drawTimeline(data) {

    const filtered = data.filter(d => d.category === selectedCategory);

    const { g, width, height } = createSVG("#timeline");

    const x = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.races)])
        .range([height, 0]);

    drawAxes(g, x, y, width, height, "Any", "nº curses");

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.races));

    g.append("path")
        .datum(filtered)
        .attr("fill", "none")
        .attr("stroke", "#ff4d4d")
        .attr("stroke-width", 2)
        .attr("d", line);
}

// ===============================
// 2. TOP RIDERS
// ===============================

function drawTopRiders(data) {

    const filtered = data.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const top = filtered
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

    const { g, width, height } = createSVG("#top-riders");

    const x = d3.scaleLinear()
        .domain([0, d3.max(top, d => d.points)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(top.map(d => d.rider_name))
        .range([0, height])
        .padding(0.2);

   drawAxes(g, x, y, width, height, "Punts", "Pilots");
   
    g.selectAll(".axis")
        .filter(function() {
         return d3.select(this).attr("transform")?.includes("rotate");
        })
        .call(d3.axisLeft(y).tickFormat(""));

    g.selectAll("rect")
        .data(top)
        .enter()
        .append("rect")
        .attr("y", d => y(d.rider_name))
        .attr("width", d => x(d.points))
        .attr("height", y.bandwidth())
        .attr("fill", "#4ea1ff");
    
}

// ===============================
// 3. CONSISTENCY
// ===============================

function drawConsistency(data) {

    const filtered = data.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const { g, width, height } = createSVG("#consistency");

    const x = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d.avg_position))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.consistency_score)])
        .range([height, 0]);

    drawAxes(g, x, y, width, height, "Posició Mitjana", "Constància");

    g.selectAll("circle")
        .data(filtered)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.avg_position))
        .attr("cy", d => y(d.consistency_score))
        .attr("r", d => Math.max(4, d.total_points / 200))
        .attr("fill", "#2ed573")
        .on("mouseover", (event, d) => {
            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.rider_name}</strong><br/>
                    Points: ${d.total_points}<br/>
                    Avg position: ${d.avg_position}<br/>
                    Consistency: ${d.consistency_score}
                `);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
}

// ===============================
// 4. MANUFACTURERS
// ===============================

function drawManufacturers(data) {

    const filtered = data.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const grouped = d3.rollups(
        filtered,
        v => d3.sum(v, d => d.points),
        d => d.bike_name
    );

    const formatted = grouped.map(d => ({
        bike: d[0],
        points: d[1]
    }));
    formatted.sort((a, b) => b.points - a.points);

    const { g, width, height } = createSVG("#manufacturers");

    const x = d3.scaleLinear()
        .domain([0, d3.max(formatted, d => d.points)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(formatted.map(d => d.bike))
        .range([0, height])
        .padding(0.2);

    drawAxes(g, x, y, width, height, "Punts", "Fabricants");

    g.selectAll("rect")
        .data(formatted)
        .enter()
        .append("rect")
        .attr("y", d => y(d.bike))
        .attr("width", d => x(d.points))
        .attr("height", y.bandwidth())
        .attr("fill", "#ffa502");
}

// ===============================
// 5. CLIMATE
// ===============================

function drawClimate(data) {

    const filtered = data.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const { g, width, height } = createSVG("#climate-impact");

    const climates = [...new Set(filtered.map(d => d.climate_zone))];

    const x = d3.scaleBand()
        .domain(climates)
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.speed)])
        .range([height, 0]);

    drawAxes(g, x, y, width, height, "Clima", "Velocitat");

    g.selectAll("rect")
        .data(filtered)
        .enter()
        .append("rect")
        .attr("x", d => x(d.climate_zone))
        .attr("y", d => y(d.speed))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.speed))
        .attr("fill", "#ff6b81");
}

// ===============================
// 6. CLIMATE MASTERS (UNCHANGED LOGIC)
// ===============================

function drawClimateMasters(climateSpecialists) {

    const yearData = climateSpecialists.filter(d =>
        Number(d.year) === Number(selectedYear) &&
        d.category === selectedCategory
    );

    const climates = [
        "tropical",
        "desert",
        "mediterranean",
        "oceanic"
    ];

    const getMaster = (climate) => {
        const filtered = yearData.filter(d => d.climate_zone === climate);
        if (!filtered.length) return null;

        return filtered.reduce((a, b) =>
            a.climate_index > b.climate_index ? a : b
        );
    };

    const masters = climates.map(getMaster).filter(Boolean);

    function renderRadar(container, climateType, title) {

        const master =
            masters.find(d => d.climate_zone === climateType)
            || { rider_name: "No data" };

        const values = climates.map(climate => {
            const row = yearData.find(d =>
                d.rider_name === master.rider_name &&
                d.climate_zone === climate
            );
            return row ? +row.climate_index : 0;
        });

        const width = 400;
        const height = 400;
        const radius = 120;

        const svg = d3.select(container)
            .html("")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const centerX = width / 2;
        const centerY = height / 2 + 20;

        const angleSlice = (Math.PI * 2) / climates.length;

        const rScale = d3.scaleLinear()
            .domain([0, d3.max(values) || 1])
            .range([0, radius]);

        // ======================
        // TITLES (RECUPERAT)
        // ======================

        svg.append("text")
            .attr("x", centerX)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "14px")
            .text(title);

        svg.append("text")
            .attr("x", centerX)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("fill", "#70a1ff")
            .attr("font-size", "13px")
            .text(master.rider_name);

        // ======================
        // GRID CIRCLES (IMPORTANT)
        // ======================

        for (let i = 1; i <= 5; i++) {
            svg.append("circle")
                .attr("cx", centerX)
                .attr("cy", centerY)
                .attr("r", (radius * i) / 5)
                .attr("fill", "none")
                .attr("stroke", "#2d3649")
                .attr("stroke-opacity", 0.6);
        }

        // ======================
        // AXES + LABELS (RECUPERAT)
        // ======================

        climates.forEach((climate, i) => {

            const angle = angleSlice * i - Math.PI / 2;

            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            svg.append("line")
                .attr("x1", centerX)
                .attr("y1", centerY)
                .attr("x2", x)
                .attr("y2", y)
                .attr("stroke", "#666");

            svg.append("text")
                .attr("x", centerX + (radius + 20) * Math.cos(angle))
                .attr("y", centerY + (radius + 20) * Math.sin(angle))
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "11px")
                .text(climate);
        });

        // ======================
        // POINTS
        // ======================

        const points = values.map((value, i) => {

            const angle = angleSlice * i - Math.PI / 2;
            const r = rScale(value);

            return [
                centerX + r * Math.cos(angle),
                centerY + r * Math.sin(angle)
            ];
        });

        // ======================
        // AREA
        // ======================

        const line = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveLinearClosed);

        svg.append("path")
            .datum(points)
            .attr("d", line)
            .attr("fill", "#70a1ff")
            .attr("fill-opacity", 0.25)
            .attr("stroke", "#70a1ff")
            .attr("stroke-width", 2);

        // ======================
        // POINT CIRCLES
        // ======================

        svg.selectAll("circle.point")
            .data(points)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", 4)
            .attr("fill", "#70a1ff");
    }

    renderRadar("#radar-tropical", "tropical", "Tropical Master");
    renderRadar("#radar-desert", "desert", "Desert Master");
    renderRadar("#radar-mediterranean", "mediterranean", "Mediterranean Master");
    renderRadar("#radar-oceanic", "oceanic", "Oceanic Master");
}

//================================
// Hall of Fame
//================================
function drawHallOfFame() {

    // =========================
    // BEST RIDER
    // =========================
    const riderTotals = d3.rollups(
        DATA.riders.filter(d =>
            d.year === selectedYear &&
            d.category === selectedCategory
        ),
        v => d3.sum(v, d => d.points),
        d => d.rider_name
    );

    const bestRider = d3.greatest(riderTotals, d => d[1]);

    d3.select("#best-rider")
        .html(bestRider ? bestRider[0] : "No data");

    // =========================
    // BEST CONSISTENCY
    // =========================
    const consistency = DATA.consistency.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const bestCons = d3.greatest(consistency, d => d.consistency_score);

    d3.select("#best-consistency")
        .html(bestCons ? bestCons.rider_name : "No data");

    // =========================
    // BEST MANUFACTURER
    // =========================
    const manuf = DATA.manufacturers.filter(d =>
        d.year === selectedYear &&
        d.category === selectedCategory
    );

    const manufTotals = d3.rollups(
        manuf,
        v => d3.sum(v, d => d.points),
        d => d.bike_name
    );

    const bestManuf = d3.greatest(manufTotals, d => d[1]);

    d3.select("#best-manufacturer")
        .html(bestManuf ? bestManuf[0] : "No data");
}


// ===============================
// TOOLTIP (optional simple)
// ===============================

function showTooltip(event, d) {
    tooltip.style("opacity", 1)
        .html(JSON.stringify(d, null, 2));
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
}

function hideTooltip() {
    tooltip.style("opacity", 0);
}