// Global parameters:
let selectedPoint = null;
let currentChannel = localStorage.getItem("current.channel");
if (currentChannel !== null) {
    currentChannel = parseInt(currentChannel);
} else {
    currentChannel = 0;
}
let channelData = {"name": "New workout", schedule: []};
let processInfo = {};
let animation = null;

let startGrafana = false;

function getChartName() {
    let name = channelData.name;
    if (!channelData.schedule || !isEqual(channelData.schedule, getSchedule())) {
        name += " (edited)";
    }
    return name;
}

function isLegendHidden() {
    return myChart.getDatasetMeta(0).hidden;
}

function isEqual(first, second) {
    if (first === second) {
        return true;
    }
    let isArray = Array.isArray(first) && Array.isArray(second);
    let isObject = typeof first === "object" && typeof second === "object";
    if (isObject || isArray) {
        for (let key in first) {
            if (!first.hasOwnProperty(key) || !second.hasOwnProperty(key)) {
                return false;
            }
            if (!isEqual(first[key], second[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function setProcessInfo(data) {
    processInfo = data;
    Object.keys(processInfo).forEach(channel => {
        processInfo[channel].startTime = new Date().getTime();
    });
}

let animationInterval = null;

// do not resize the chart canvas when its container does (keep at 600x400px)
Chart.defaults.global.responsive = true;

let table = document.getElementById("tblData");
let indexRow = table.rows[0];
let valueRow = table.rows[1];
let intervalRow = table.rows[2];
let timeRow = table.rows[3];

function getIndexFromTd(element) {
    return Array.from(element.parentNode.children).indexOf(element) - 1;
}

function getTd(row, index) {
    if (row.cells.length <= index) {
        let element = document.createElement("td");
        element.onclick = function (evt) {
            // if (evt.target.tagName === "INPUT") {
            //     return;
            // }
            let index = getIndexFromTd(element);
            if (evt.ctrlKey) {
                insertPointAfter(index);
            } else if (evt.shiftKey) {
                removePoint(index);
            } else {
                selectPoint(index);
            }
        };
        row.appendChild(element);
    }
    return row.cells[index];
}

function getInput(element, onChange) {
    if (element.firstChild === null) {
        let input = generateInput(onChange);
        element.appendChild(input);
        return input;
    }
    if (element.firstChild.tagName === "INPUT") {
        return element.firstChild;
    } else {
        element.firstChild.remove();
        return getInput(element, onChange);
    }
}

function generateInput(onChange) {
    let input = document.createElement("input");
    input.className = "time-input";
    input.size = "1";
    input.type = "text";
    input.onchange = function (event) {
        if (onChange) {
            onChange.apply(this, arguments);
        }

        let index = getIndexFromTd(input.parentNode);
        updatePoint(index);
    };
    return input;
}

function setIndex(index, value) {
    let element = getTd(indexRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    element.textContent = value;
}

function setValue(index, value) {
    let element = getTd(valueRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element, (event) => {
        if (event.target.value <= 0 || event.target.value > 14) {
            updateTable();
            alert("Invalid data provided");
            return;
        }
        updateChart(() => convertSchedule(parseSchedule()));
    });
    input.value = value;
    input.disabled = isProcessAlive(currentChannel) || isLegendHidden();
}

function setIntervalValue(index, value) {
    let element = getTd(intervalRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element, (event) => {
        if (!isTimeValid(event.target.value)) {
            updateTable();
            alert("Invalid data provided");
            return;
        }
        updateChart(() => convertSchedule(parseSchedule()));
    });
    input.value = value;
    input.disabled = isProcessAlive(currentChannel) || isLegendHidden();
}

function setTime(index, value) {
    let element = getTd(timeRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element, () => {
        if (!isTimeValid(event.target.value)) {
            updateTable();
            alert("Invalid data provided");
            return;
        }
        updateChart(() => parseData());
    });
    input.value = value;
    input.disabled = isProcessAlive(currentChannel) || isLegendHidden();
}

function removeExcess(row) {
    let data = getData();
    while (data.length < row.cells.length - 1) {
        row.cells[row.cells.length - 1].remove();
    }
}

function timeFromMinutes(minutes) {
    return newDateString(Math.floor(minutes / 60), Math.round(minutes % 60));
}

function isTimeValid(value) {
    if (value.length !== 5) {
        return false;
    }
    if (value.charAt(2) !== ':') {
        return false;
    }
    for (let i = 0; i < value.length; i++) {
        if (i === 2) {
            continue;
        }
        let charCodeAt = value.charCodeAt(i);
        if (charCodeAt < 48 || charCodeAt > 57) {
            return false;
        }
    }
    return true;
}

function newDateString(hours, minutes) {
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

function parseTimeToMinutes(value) {
    let split = value.split(":");
    let hours = Math.max(parseInt(split[0] * 60), 0);
    let minutes = Math.max(parseInt(split[1]), 0);
    return hours + minutes;
}

function insertPointAfter(index) {
    if (isProcessAlive(currentChannel)) {
        alert("You can not insert point for current channel, because channel is alive!");
        return;
    }

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
    // if (isSelectedChannelAlive()) {
    //     return false;
    // }
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
    myChart.data.datasets[0].label = getChartName();
    // myChart.data.datasets[0].backgroundColor = isProcessAlive(currentChannel) ? "rgba(255, 255, 255, 0.4)" : "rgba(75, 192, 192, 0.4)";
    // myChart.data.datasets[0].borderColor = isProcessAlive(currentChannel) ? "rgb(200, 200, 200)" : "rgb(75, 192, 192)";
    myChart.data.datasets[0].backgroundColor = generateGradient("rgba(75, 192, 192, 0.4)", "rgba(255, 255, 255, 0.4)");
    myChart.data.datasets[0].borderColor = generateGradient("rgb(75, 192, 192)", "rgb(200, 200, 200)");

    // for (let i = 0; i < myChart.tooltip.length; i++)
    // {
    //     myChart.tooltip[i].hidden = true;
    // }
    // // myChart.tooltip._active = [];
    // //
    // myChart.tooltip._eventPosition = {0, 0};

    myChart.options.tooltips.enabled = !isSelectedChannelAlive();
    myChart.update();
}

function clearData() {
    selectedPoint = null;

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
        let currentInterval = Math.max(point.x - lastValue, 1);
        schedule.push({
            y: point.y,
            x: currentInterval
        });
        lastValue = point.x;
    }
    return schedule;
}

function updateChart(functionToParse) {
    // if (isSelectedChannelAlive()) {
    //     updateTable();
    //     updateData();
    //     return false;
    // }
    let data = functionToParse();
    setData(data);
    saveChannel();
}

function updateRecalibrateButton() {
    $.get("/calibrate_time", function (data) {
        document.getElementById("lastCalibrationLabel").textContent = data['calibration']['ph']['chan' + (currentChannel + 1)]['date'];

        setTimeout(updateRecalibrateButton, 2000);
    });
}

function updateTable() {
    console.log("UPDATE TABLE");

    let data = getData();
    let schedule = convertData(data);
    for (let i = 0; i < schedule.length; i++) {
        let point = schedule[i];
        setIndex(i + 1, i + 1);
        setValue(i + 1, point.y);
        setIntervalValue(i + 1, timeFromMinutes(point.x));
        setTime(i + 1, timeFromMinutes(data[i].x));
    }
    removeExcess(indexRow);
    removeExcess(valueRow);
    removeExcess(intervalRow);
    removeExcess(timeRow);

    document.getElementById("managePoints").className = selectedPoint !== null ? "active" : "";

    document.getElementById("tblData").className = (isSelectedChannelAlive() || isLegendHidden()) ? "disabled" : "";

    saveChannel();
}

function updatePoint(i) {
    let data = getData();

    let lastValue = i > 0 ? data[i - 1].x : 0;
    let point = data[i];
    setIndex(i + 1, i + 1);
    setValue(i + 1, point.y);
    setIntervalValue(i + 1, timeFromMinutes(point.x - lastValue));
    setTime(i + 1, timeFromMinutes(point.x));
    saveChannel();
}

function removePoint(index) {
    if (isProcessAlive(currentChannel)) {
        alert("You can not remove point for current channel, because channel is alive!");
        return;
    }
    var schedule = getSchedule();
    schedule.splice(index, 1);
    setData(convertSchedule(schedule));
    updateTable();
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
let holder = document.getElementById("myChart");
let ctx = document.getElementById("myChart").getContext("2d");
// let progress = document.getElementById('animationProgress');
// let processStop = false;

function generateGradient(firstColor, secondColor) {
    let maxX = myChart.chartArea.right - myChart.chartArea.left;

    let time;
    let maxTime;
    if (animation !== null) {
        time = (animation.process.start) * 1000 + (new Date().getTime() - animation.startTime);
        maxTime = animation.process.time * 1000;
    } else {
        time = 1;
        maxTime = 1;
    }
    let x = (0.003 + (time / maxTime)) * maxX;

    let gradient = ctx.createLinearGradient(myChart.chartArea.left + x, 0, myChart.chartArea.left + x + 1, 0);
    gradient.addColorStop(0, firstColor);
    gradient.addColorStop(1, secondColor);

    return gradient;
}

let gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
gradientStroke.addColorStop(0, '#80b6f4');

gradientStroke.addColorStop(1, '#f49080');

window.oncontextmenu = function (evt) {
    if (evt.target === holder) {
        return false;
    }
};

document.addEventListener('keyup', function (e) {
    if (e.keyCode === 27) {
        myChart.resetZoom();
    }
    if (e.keyCode === 13) {
        var selectedTemplate = $("#templatesList:focus").children("option:selected").val();
        if (selectedTemplate) {
            loadTemplateFromFile(selectedTemplate);
        }
    }
});


document.getElementById("openModal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "flex";
});
document.getElementById("closeModal").addEventListener("click", function () {
    closeModal();
});
document.getElementById("modal").addEventListener("click", function (event) {
    if (event.target.id === "modal") {
        closeModal();
    }
});

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

document.getElementById("recalibrate").addEventListener("click", function () {
    window.open("/calibrate", "", "height=410,width=450,location=0,menubar=0,status=0,titlebar=0,toolbar=0");
});

function getOffsetTop(elem) {
    let offsetTop = 0;
    do {
        if (!isNaN(elem.offsetTop)) {
            offsetTop += elem.offsetTop;
        }
    } while (elem = elem.offsetParent);
    return offsetTop;
}

function updateGrafana() {
    let url = new URL(grafanaUrl);
    let params = url.searchParams;
    if (isLegendHidden() && startGrafana) {
        params.set("from", "now-4m");
        params.set("to", "now+1m");

        document.getElementById("grafana").src = url.toString();
        showGrafana();
        document.scrollingElement.scrollTop = getOffsetTop(document.getElementById("grafana"))
    } else if (isSelectedChannelAlive()) {
        let process = processInfo[currentChannel];

        let time = (process.process.start) * 1000 + (new Date().getTime() - process.startTime);
        let maxTime = process.process.time * 1000;

        params.set("from", (new Date().getTime() - time).toFixed(0));
        params.set("to", (new Date().getTime() - time + maxTime + 60000).toFixed(0));

        document.getElementById("grafana").src = url.toString();
        showGrafana();
        document.scrollingElement.scrollTop = getOffsetTop(document.getElementById("grafana"))
    } else if (!startGrafana) {
        hideGrafana();
    }
}

function showGrafana() {
    document.getElementById("grafana-container").style.display = "block";
}

function hideGrafana() {
    document.getElementById("grafana-container").style.display = "none";
}


document.getElementById("start").addEventListener("click", function () {
    if (isAnyCheckedProcessAlive()) {
        alert("Can not to start process for already alive channel");
        return;
    }
    if (isLegendHidden()) {
        startGrafana = true;
        updateGrafana();
        updateButtons();
        return;
    }
    // let url = new URL(grafanaUrl);
    // let params = url.searchParams;
    //
    // params.set("from", "now-4m");
    // params.set("to", "now+1m");
    //
    // document.getElementById("grafana").src = url.toString();
    // document.getElementById("grafana-container").style.display = "block";

    let checkedChannels = getCheckedChannels();
    $.ajax({
        url: "/start_button",
        type: "POST",
        success: function (data) {
            saveChannels(checkedChannels);
            // processInfo = data;
            setProcessInfo(data);
            updateGrafana();
            checkedChannels.forEach(channel => waitForKillProcess(channel));
            updateButtons();
        },
        contentType: "application/json",
        data: JSON.stringify({"schedule": getSchedule(), "channels": checkedChannels})
    });
});

document.getElementById("stop").addEventListener("click", function () {
    if (isLegendHidden()) {
        startGrafana = false;
        updateGrafana();
        updateButtons();
        return;
    }
    $.ajax({
        url: "/stop_button",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"channels": getCheckedChannels()}),
        success: function (data) {
            if (data === "OK") {
                updateGrafana();
                updateButtons();
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

document.getElementById("templatesList").ondblclick = function () {
    var selectedTemplate = $("#templatesList").children("option:selected").val();
    loadTemplateFromFile(selectedTemplate);
};

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
        let meta = this.getMeta();
        let me = meta.dataset;
        let vm = me._view;
        let ctx = this.chart.ctx;
        let points = me._children;

        if (!points.length) {
            return;
        }

        let data = meta.data;
        if (data.length > 0 && data[0]._view.x !== 0 && data[0]._view.x >= 0) {
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
        let point = selectedPoint !== null && selectedPoint < points.length ? points[selectedPoint] : null;
        let backgroundColor;
        if (point !== null) {
            backgroundColor = vm.backgroundColor;
            point._view.backgroundColor = "rgb(255, 0, 0)";
        }
        Chart.controllers.line.prototype.draw.apply(this, arguments);
        if (point !== null) {
            point._view.backgroundColor = backgroundColor;
        }
        // console.log(arguments);
    }
});
Chart.controllers.customLine = customLine;

// create the chart using the chart canvas
var myChart = new Chart(ctx, {
    type: 'customLine',
    data: chartData,
    options: {
        legend: {
            display: true,
            labels: {
                fontSize: 18
            },
            onClick: function (e, legendItem) {
                if (isSelectedChannelAlive()) {
                    return;
                }

                var index = legendItem.datasetIndex;
                var ci = this.chart;
                var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;
                ci.getDatasetMeta(index).hidden = !alreadyHidden;

                ci.update();

                updateButtons();
            }
        },
        dragData: true,
        dragX: true,
        dragDataRound: 2,
        onDragStart() {
            if (isSelectedChannelAlive()) {
                return false;
            }
        },
        onDrag: function (event, datasetIndex, index, value) {
            let data = myChart.data.datasets[datasetIndex].data;
            if (value.y <= 0) {
                value.y = 0.01;
            }
            if (value.x <= 0) {
                value.x = 1;
            }
            value.x = Math.round(value.x);
            if (index > 0 && data[index - 1].x >= value.x) {
                value.x = data[index - 1].x + 1;
            } else if (index < data.length - 1 && data[index + 1].x <= value.x) {
                value.x = data[index + 1].x;
            }
            updatePoint(index);
            updateChart(() => convertSchedule(parseSchedule()));
        },
        onDragEnd: function (e, datasetIndex, index, value) {
            updatePoint(index);
            updateChart(() => convertSchedule(parseSchedule()));
        },
        scales: {
            yAxes: [{
                ticks: {
                    max: 14,
                    min: 0,
                    stepSize: 1.0,
                    callback: function (value) {
                        return Math.round(value) + " pH"
                    }
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
                    userCallback: function (label, index, labels) {
                        if (Math.round(label) === label) {
                            return timeFromMinutes(label);
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
            mode: 'nearest',
            intersect: true,
            callbacks: {
                title: function (tooltipItems, data) {
                    let item = tooltipItems[0];
                    return "Index: " + (item.index + 1) + "\nInterval: " + timeFromMinutes(getSchedule()[item.index].x) + " [hh:mm]";
                },
                label: function (tooltipItems, data) {
                    return tooltipItems.yLabel + " pH";
                },
                footer: function () {
                    return "(CTRL + Left Mouse Button to add point)\n(SHIFT + Left Mouse Button to delete point)"
                }
            },
            animationDuration: 0
        },
        plugins: {
            zoom: {
                zoom: {
                    enabled: true,
                    mode: "x",
                    drag: true
                }
            }
        }
    }
});
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
    let element = indexRow.cells[index + 1];
    let parentTable = element.parentNode.parentNode.parentNode.parentNode;
    parentTable.scrollLeft = element.offsetLeft - (parentTable.clientWidth / 2);

    selectedPoint = index;
    updateTable();
    updateData();
}

function animationStart(process) {
    resetAnimation();

    animation = process;

    // let time = (process.process.start) * 1000 + (new Date().getTime() - process.startTime);
    // let maxTime = process.process.time * 1000;
    animationInterval = window.setInterval(function () {
        let time = (process.process.start) * 1000 + (new Date().getTime() - process.startTime);
        let maxTime = process.process.time * 1000;
        let progress = (time / maxTime);
        // progress.value = 0.003 + (time / maxTime);
        updateData();
        if (progress >= 1) {
            stopAnimation();
        }
    }, 10);

    // startAnimation(progress, process.process.start * 1000, process.process.time * 1000, 10);
}

function startAnimation(element, time, maxTime, offset) {
    if (processStop === false) {

        element.value = 0.003 + (time / maxTime);
        if (element.value >= 1) {
            return;
        }

        window.setTimeout(function () {
            startAnimation(element, time + offset, maxTime, offset);
        }, Math.min(maxTime - time, offset));
    }
}

function stopAnimation() {
    console.log("stop");
    // processStop = true;
    animationInterval !== null && clearInterval(animationInterval);
}

function resetAnimation() {
    stopAnimation();
    animation = null;
    updateData();
    // progress.value = 0;
}

function createChannelButton(index, id, onchange) {
    let button = document.createElement("button");
    button.textContent = "channel" + (index + 1);
    button.onclick = onchange;
    button.id = id;


    return button;
}

function createChannelInput(divId, index, id, type, name, onchange) {
    let node = document.createElement('div');
    node.id = divId;
    let input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.name = name;
    let label = document.createElement("label");
    label.setAttribute("for", input.id);
    label.textContent = "channel" + (index + 1);

    input.onchange = onchange;

    node.appendChild(input);
    node.appendChild(label);

    return node;
}

function selectChannel(index) {
    currentChannel = index;
    console.log("select channel " + index);
    localStorage.setItem("current.channel", index);
    loadChannel(index);

    myChart.getDatasetMeta(0).hidden = false;
    startGrafana = false;
    updateGrafana();
    updateButtons();
}

function getCheckedChannels() {
    let checked = [];
    let checkboxes = document.getElementById("channelCheckboxes").getElementsByTagName("input");

    for (let i = 0; i < numberOfChannels; i++) {
        // let checkbox = document.getElementById("check" + i);
        // if (checkbox && checkbox.checked) {
        if (checkboxes[i].checked) {
            checked.push(i);
        }
    }
    return checked;
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
    if (isSelectedChannelAlive()) {
        alert("You can not load template for current channel, because channel is alive!");
        return;
    }
    if (getData().length > 0 && !confirm("Are you sure you want to load the new template? The current chart will be replaced.")) {
        return;
    }
    $.get("/getTemplateSchedule", {templateName: selectedTemplate}).done(function (data) {
        let schedule = data.schedule;

        channelData.name = selectedTemplate;
        channelData.schedule = schedule;

        myChart.getDatasetMeta(0).hidden = false;
        closeModal();

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
    console.log("LOAD CHANNEL " + index);
    let item = localStorage.getItem("channel." + index);

    clearData();
    if (!item) {
        return;
    }
    console.log(item);
    let data = JSON.parse(item);
    if (data.data === undefined || data.schedule === undefined) {
        data.data = channelData;
        data.schedule = data;
    }
    channelData = data.data;
    setData(convertSchedule(data.schedule));
    updateTable();
}

function saveChannel() {
    saveChannels([currentChannel])
}

function saveChannels(channels) {
    for (let i in channels) {
        localStorage.setItem("channel." + channels[i], JSON.stringify({
            "schedule": getSchedule(),
            "data": channelData
        }));
    }
}

function isSelectedChannelAlive() {
    return isProcessAlive(currentChannel);
}

function isProcessAlive(channel) {
    return processInfo[channel] !== undefined && processInfo[channel].alive;
}

function isAnyCheckedProcessAlive() {
    let channels = getCheckedChannels();
    for (let key in channels) {
        console.log("channel id " + channels[key]);
        if (isProcessAlive(channels[key])) {
            return true;
        }
    }
    return false;
}

function updateButtons() {
    let realAlive = isProcessAlive(currentChannel);
    let alive = realAlive || startGrafana;
    document.getElementById("start").hidden = alive;
    document.getElementById("stop").hidden = !alive;
    // document.getElementById("outerProgress").className = realAlive ? "outerProgress start" : "outerProgress";

    document.getElementById("channelCheckTitle").textContent = alive ? "Stop this schedule for channels:" : "Start this schedule for channels:";

    let buttons = document.getElementById('channelButtons');
    let checkboxes = document.getElementById('channelCheckboxes');
    buttons.innerHTML = "";
    checkboxes.innerHTML = "";
    for (let i = 0; i < numberOfChannels; i++) {
        let channelButton = createChannelButton(i, "channel" + i, function () {
            selectChannel(i);
        });
        buttons.appendChild(channelButton);
        let checkDiv = createChannelInput("checkDiv" + i, i, "check" + i, "checkbox", "check");
        checkboxes.appendChild(checkDiv);

        let processAlive = isProcessAlive(i);
        if ((alive && processAlive) || (!alive && !processAlive)) {
            checkDiv.className = "";
            if (!alive && processAlive) {
                checkDiv.children[0].checked = true;
                checkDiv.children[0].disabled = true;
            }
        } else {
            checkDiv.className = "running";
            checkDiv.children[0].disabled = true;
            checkDiv.children[1].textContent = checkDiv.children[1].textContent + (processAlive ? " (running)" : " (not running)");
        }

        if (i === currentChannel) {
            channelButton.classList.add("active");
        }
        if (processAlive) {
            channelButton.classList.add("running");
        }
    }
    document.getElementById("check" + currentChannel).checked = true;
    document.getElementById("check" + currentChannel).disabled = true;

    resetAnimation();
    if (realAlive) {
        let process = processInfo[currentChannel];
        animationStart(process);
    }

    updateData();
    updateTable();

    document.getElementById("add").disabled = alive || isLegendHidden();
    document.getElementById("addAfterPoint").disabled = alive || isLegendHidden();
    document.getElementById("removePoint").disabled = alive || isLegendHidden();
    document.getElementById("saveTemplate").disabled = alive || isLegendHidden();
    document.getElementById("loadTemp").disabled = alive || isLegendHidden();
    document.getElementById("deleteTemp").disabled = alive || isLegendHidden();
    document.getElementById("recalibrate").disabled = alive;
    document.getElementById("openModal").disabled = alive || isLegendHidden();
}

function waitForKillProcess(channel) {
    channel = parseInt(channel);
    if (isProcessAlive(channel)) {
        // if (channel === currentChannel) {
        //     let process = processInfo[channel];
        //     console.log("TRY START")
        //     startAnimation(progress, process.process.start * 1000, process.process.time * 1000, 10);
        // }

        $.ajax({
            url: "/wait_process",
            type: "POST",
            success: function (data) {
                // processInfo = data.channels;
                setProcessInfo(data.channels);
                if (data.status === "OK") {
                    updateGrafana();
                    updateButtons();
                    stopAnimation();
                }
            },
            contentType: "application/json",
            data: JSON.stringify({"channel": channel})
        });
    }
}

function onStart() {
    selectChannel(currentChannel);
    $.get("/process_alive", function (data) {
        // processInfo = data;
        setProcessInfo(data);
        Object.keys(processInfo).forEach((channel) => waitForKillProcess(channel));
        updateButtons();
    });
    loadListOfTemplates();

    updateRecalibrateButton();
}

function parseSchedule() {
    var schedule = [];

    var n = table.rows[0].cells.length;
    for (var i = 1; i < n; i++) {
        let point = {
            x: Math.max(parseTimeToMinutes(table.rows[2].cells[i].children[0].value), 1),
            y: parseFloat(table.rows[1].cells[i].children[0].value).toFixed(2)
        };
        schedule.push(point);
    }
    return schedule;
}

function parseData() {
    var data = [];

    let lastTime = 0;
    var n = table.rows[0].cells.length;
    for (var i = 1; i < n; i++) {
        let parsedTime = parseTimeToMinutes(table.rows[3].cells[i].children[0].value);
        let point = {
            x: lastTime >= parsedTime ? lastTime + 1 : parsedTime,
            y: parseFloat(table.rows[1].cells[i].children[0].value).toFixed(2)
        };
        data.push(point);
        lastTime = point.x;
    }
    return data;
}
