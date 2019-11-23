// Global parameters:
let selectedPoint = null;
let currentChannel = localStorage.getItem("current.channel");
if (currentChannel !== null) {
    currentChannel = parseInt(currentChannel);
} else {
    currentChannel = 0;
}

// do not resize the chart canvas when its container does (keep at 600x400px)
Chart.defaults.global.responsive = true;

let table = document.getElementById("tblData");
let indexRow = table.rows[0];
let valueRow = table.rows[1];
let timeRow = table.rows[2];

function getTd(row, index) {
    if (row.cells.length <= index) {
        let element = document.createElement("td");
        row.appendChild(element);
    }
    return row.cells[index];
}

function getInput(element) {
    if (element.firstChild === null) {
        let input = generateInput();
        element.appendChild(input);
        return input;
    }
    if (element.firstChild.tagName === "input") {
        return element.firstChild;
    } else {
        element.firstChild.remove();
        return getInput(element);
    }
}

function setIndex(index, value) {
    let element = getTd(indexRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    element.textContent = value;
}

function setValue(index, value) {
    let element = getTd(valueRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element);
    input.value = value;
}

function setTime(index, value) {
    let element = getTd(timeRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element);
    input.value = value;
}

function removeExcess(row) {
    let data = getData();
    while (data.length < row.cells.length - 1) {
        row.cells[row.cells.length - 1].remove();
    }
}

function timeFromMinutes(minutes) {
    return newDateString(Math.floor(minutes / 60), Math.floor(minutes % 60));
}

function newDateString(hours, minutes) {
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

function parseTimeToMinutes(value) {
    let split = value.split(":");
    return (parseInt(split[0]) * 60) + parseInt(split[1]);
}

function insertPointAfter(index) {
    let schedule = getSchedule();
    let point = schedule[index];
    schedule.splice(index + 1, 0, {
        y: point.y,
        x: point.x
    });

    setData(convertSchedule(schedule));
    updateTable();
}

function setData(data) {
    myChart.data.datasets[0].data = data;
    updateData();
}

function getData() {
    return myChart.data.datasets[0].data;
}

function getSchedule() {
    return convertData(getData());
}

function updateData() {
    myChart.update();
}

function clearData() {
    setData([]);
    updateTable();
}

function convertSchedule(schedule) {
    let data = [];
    var actualTime = 0;
    for (var i = 0; i < schedule.length; i++) {
        actualTime += schedule[i].x;
        data.push({
            x: actualTime,
            y: schedule[i].y
        });
    }
    return data;
}

function convertData(data) {
    let schedule = [];
    let lastValue = 0;
    for (let i = 0; i < data.length; i++) {
        let point = data[i];
        schedule.push({
            y: point.y,
            x: point.x - lastValue
        });
        lastValue = point.x;
    }
    return schedule;
}

function updateChart() {
    console.log("UPDATE CHART");
    let tableData = parseData();
    setData(convertSchedule(tableData));
    saveChannel();
}

function updateTable() {
    console.log("UPDATE TABLE");

    let schedule = convertData(getData());
    for (let i = 0; i < schedule.length; i++) {
        let point = schedule[i];
        setIndex(i + 1, i + 1);
        setValue(i + 1, point.y);
        setTime(i + 1, timeFromMinutes(point.x));
    }
    removeExcess(indexRow);
    removeExcess(valueRow);
    removeExcess(timeRow);

    document.getElementById("managePoints").className = selectedPoint !== null ? "active" : "";

    saveChannel();
}

function updatePoint(i) {
    let data = getData();

    let lastValue = i > 0 ? data[i - 1].x : 0;
    let point = data[i];
    setIndex(i + 1, i + 1);
    setValue(i + 1, point.y);
    setTime(i + 1, timeFromMinutes(point.x - lastValue));
    saveChannel();
}

function removePoint(index) {
    var schedule = getSchedule();
    schedule.splice(index, 1);
    setData(convertSchedule(schedule));
    updateTable();
    updateChart();
}

// define the chart data
var chartData = {
        datasets: [{
            label: legend,
            fill: true,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 5,
            pointHitRadius: 10,
            data: 0,
            spanGaps: false,
            steppedLine: 'after',
            responsive: true
        }]
    }
;

// get chart canvas
var holder = document.getElementById("myChart");
var ctx = document.getElementById("myChart").getContext("2d");
var progress = document.getElementById('animationProgress');
var processStop = false;

document.getElementById("start").addEventListener("click", function () {
    $.ajax({
        url: "/start_button",
        type: "POST",
        success: function (data) {
            waitForKillProcess(data);
            updateButtons(data.alive);
        },
        contentType: "application/json",
        data: JSON.stringify({schedule: getSchedule()}),
    });
});

document.getElementById("stop").addEventListener("click", function () {
    $.ajax({
        url: "/stop_button",
        type: "POST",
        success: function (data) {
            if (data === "OK") {
                updateButtons(false);
            }
        }
    });
});
document.getElementById("add").addEventListener("click", function () {
    let schedule = getSchedule();
    let x = schedule.length > 0 ? schedule[schedule.length - 1].x : 7;
    let y = schedule.length > 0 ? schedule[schedule.length - 1].y : 10;
    schedule.push({
        y: y,
        x: x
    });
    setData(convertSchedule(schedule));
    updateTable();
});

document.getElementById("addAfterPoint").addEventListener("click", function () {
    if (selectedPoint !== null) {
        insertPointAfter(selectedPoint);
    }
});

document.getElementById("removePoint").addEventListener("click", function () {
    if (selectedPoint !== null) {
        removePoint(selectedPoint);
    }
});

document.getElementById("loadTemp").addEventListener("click", function () {
    var selectedTemplate = $("#templatesList").children("option:selected").val();
    if (!selectedTemplate) {
        alert("You have to choose file");
        return;
    }
    loadTemplateFromFile(selectedTemplate);
});

document.getElementById("deleteTemp").addEventListener("click", function () {
    var selectedTemplate = $("#templatesList").children("option:selected").val();
    if (!selectedTemplate) {
        alert("You have to choose file");
    }
    deleteTemplate(selectedTemplate);
});

document.getElementById("saveTemplate").addEventListener("click", function () {
    saveTemplate();
});


function setStyle(ctx, vm) {
    ctx.lineCap = vm.borderCapStyle;
    ctx.setLineDash(vm.borderDash);
    ctx.lineDashOffset = vm.borderDashOffset;
    ctx.lineJoin = vm.borderJoinStyle;
    ctx.lineWidth = vm.borderWidth;
    ctx.strokeStyle = vm.borderColor;
    ctx.fillStyle = vm.backgroundColor;
}

Chart.controllers.customLine = Chart.controllers.line;
var customLine = Chart.controllers.line.extend({
    draw: function () {
        var meta = this.getMeta();
        var me = meta.dataset;
        var vm = me._view;
        var ctx = this.chart.ctx;
        let points = me._children;

        if (!points.length) {
            return;
        }

        var data = meta.data;
        if (data.length > 0 && data[0].x !== 0) {

            let point = points[0]._view;

            ctx.save();

            setStyle(ctx, vm);

            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(this.chart.chartArea.left, point.y);
            ctx.fillRect(this.chart.chartArea.left, point.y, point.x - this.chart.chartArea.left, this.chart.chartArea.bottom - point.y);
            ctx.stroke();
            ctx.restore();
        }
        Chart.controllers.line.prototype.draw.apply(this, arguments);
    }
});
Chart.controllers.customLine = customLine;

// create the chart using the chart canvas
var myChart = new Chart(ctx, {
    type: 'customLine',
    data: chartData,
    options: {
        legend: {
            display: false
        },
        dragData: true,
        dragX: true,
        dragDataRound: 2,
        onDrag: function (event, datasetIndex, index, value) {
            var data = myChart.data.datasets[datasetIndex].data;
            if (value.y <= 0) {
                value.y = 0.01;
            }
            if (index > 0 && data[index - 1].x > value.x) {
                value.x = data[index - 1].x;
            } else if (index < data.length - 1 && data[index + 1].x < value.x) {
                value.x = data[index + 1].x;
            }
            updatePoint(index);
            updateChart();
        },
        onDragEnd: function (e, datasetIndex, index, value) {
            updatePoint(index);
            updateChart();
        },
        scales: {
            yAxes: [{
                ticks: {
                    max: 14,
                    min: 0,
                    stepSize: 1.0,
                },
                gridLines: {
                    color: "rgba(255, 255, 255, 0.25)",
                }
            }],
            xAxes: [{
                type: "linear",
                ticks: {
                    precision: 0,
                    beginAtZero: true,
                    min: 0,
                    suggestedMin: 0,
                    userCallback: function (label, index, labels) {
                        if (Math.round(label) === label) {
                            return timeFromMinutes(label);
                        }
                    },
                    callbacks: {
                        afterUpdate: function () {
                            console.log(arguments);
                        }
                    }
                },
                gridLines: {
                    color: "rgba(255, 255, 255, 0.25)",
                }
            }]
        },
        tooltips: {
            enabled: true,
            mode: 'single',
            callbacks: {
                title: function (tooltipItems, data) {
                    return timeFromMinutes(tooltipItems[0].xLabel);
                },
                label: function (tooltipItems, data) {
                    firstPointCtx = "First Point Selected: ";
                    return tooltipItems.yLabel + ' pH';
                }
            }
        }
    }
});
// get the text element below the chart
var pointSelected = document.getElementById("pointSelected");

// create a callback function for updating the selected index on the chart
holder.onclick = function (evt) {
    console.log(evt);
    var activePoint = myChart.getElementAtEvent(evt);
    if (activePoint.length > 0 && evt.ctrlKey) {
        insertPointAfter(activePoint[0]._index);
    } else if (activePoint.length > 0 && evt.shiftKey) {
        removePoint(activePoint[0]._index);
    } else if (activePoint.length > 0) {
        selectPoint(activePoint[0]._index);
    }
};

function selectPoint(index) {
    pointSelected.innerHTML = 'Point selected... index: ' + (index + 1);

    let element = indexRow.cells[index + 1];
    let parentTable = element.parentNode.parentNode.parentNode.parentNode;
    parentTable.scrollLeft = element.offsetLeft - (parentTable.clientWidth / 2);

    selectedPoint = index;
    updateTable();
}

function startAnimation(element, time, maxTime, offset) {
    if (processStop === false) {
        element.value = time / maxTime;
        if (element.value >= 1) {
            return;
        }

        window.setTimeout(function () {
            startAnimation(element, time + offset, maxTime, offset);
        }, Math.min(maxTime - time, offset));
    } else processStop = false;
}

function stopAnimation() {
    processStop = true;
}

function generateInput() {
    let input = document.createElement("input");
    input.className = "time-input";
    input.size = "1";
    input.type = "text";
    input.onchange = function () {
        updateChart();
    };
    return input;
}

function createChannels() {
    var div = document.getElementById('channelRadios');
    for (var i = 0; i < numberOfChannels; i++) {

        console.log(numberOfChannels);

        var node = document.createElement('div');
        var input = document.createElement("input");
        input.type = "radio";
        input.id = "check" + i;
        input.name = "check";
        var label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.textContent = "channel" + i;

        let index = i;
        input.onchange = function (event) {
            selectChannel(index);
        };

        node.appendChild(input);
        node.appendChild(label);
        div.appendChild(node);
    }
}

function selectChannel(index) {
    currentChannel = index;
    console.log("select channel " + index);
    localStorage.setItem("current.channel", index);
    document.getElementById("channelId").textContent = index;
    document.getElementById("check" + index).checked = true;

    loadChannel(index);
}

function loadListOfTemplates() {
    $.get("/schedules", function (data) {
        $('#templatesList').children('option').remove();

        var files = data;
        console.log(files);

        var list = document.getElementById("templatesList");

        for (let file in files) {
            var option = document.createElement("option");
            option.innerHTML = files[file];

            console.log(files[file]);
            list.add(option);
        }
    });
}

function loadTemplateFromFile(selectedTemplate) {
    $.get("/getTemplateSchedule", {templateName: selectedTemplate}).done(function (data) {
        var schedule = data.schedule.map(x => {
            return {x: x.interval, y: x.pH};
        });

        clearData();

        setData(convertSchedule(schedule));
        updateTable();
    });
}

function deleteTemplate(selectedTemplate) {
    $.get("/deleteTemplate", {templateName: selectedTemplate});
    loadListOfTemplates();
}


function saveTemplate() {
    templateName = prompt("Name of template");
    if (!templateName || templateName === "") {
        alert("Invalid name of template");
        return;
    }
    templateDescription = prompt("Description of template");
    $.ajax({
        url: "/saveTemplate",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({schedule: getSchedule(), name: templateName, description: templateDescription})
    });
    loadListOfTemplates();
}

function loadChannel(index) {
    let item = localStorage.getItem("channel." + index);

    clearData();
    if (!item) {
        return;
    }
    setData(convertSchedule(JSON.parse(item)));
    updateTable();
}

function saveChannel() {
    localStorage.setItem("channel." + currentChannel, JSON.stringify(parseData()));
}

function updateButtons(alive) {
    document.getElementById("start").disabled = alive;
    document.getElementById("stop").disabled = !alive;
}

function waitForKillProcess(data) {
    if (!data.alive) {
        return;
    }
    startAnimation(progress, data.process.start * 1000, data.process.time * 60 * 1000, 10);

    $.get("/wait_process", function (data) {
        if (data === "OK") {
            updateButtons(false);
            stopAnimation();
        }
    });
}

function onStart() {
    $.get("/process_alive", function (data) {
        waitForKillProcess(data);
        updateButtons(data.alive);
    });
    createChannels();
    selectChannel(currentChannel);
    loadListOfTemplates();
}

function parseData() {

    var schedule = [];

    var n = table.rows[0].cells.length;
    for (var i = 1; i < n; i++) {
        let point = {
            x: parseTimeToMinutes(table.rows[2].cells[i].children[0].value),
            y: parseFloat(table.rows[1].cells[i].children[0].value)
        };
        schedule.push(point);
    }
    return schedule;
}
