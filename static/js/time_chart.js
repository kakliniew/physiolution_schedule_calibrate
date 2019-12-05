// Global parameters:
let selectedPoint = null;
let currentChannel = localStorage.getItem("current.channel");
if (currentChannel !== null) {
    currentChannel = parseInt(currentChannel);
} else {
    currentChannel = 0;
}
let channelData = {"name": "New workout", "edited": false};
let processInfo = {};

function getChartName() {
    return channelData.name + (channelData.edited ? " (edited)" : "")
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
            if (evt.target.tagName === "INPUT") {
                return;
            }
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
    if (element.firstChild.tagName === "input") {
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
            onChange();
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
    let input = getInput(element, () => {
        updateChart(() => convertSchedule(parseSchedule()));
    });
    input.value = value;
}

function setIntervalValue(index, value) {
    let element = getTd(intervalRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element, () => {
        updateChart(() => convertSchedule(parseSchedule()));
    });
    input.value = value;
}

function setTime(index, value) {
    let element = getTd(timeRow, index);
    element.className = index - 1 === selectedPoint ? "active" : "";
    let input = getInput(element, () => {
        updateChart(() => parseData());
    });
    input.value = value;
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
    channelData.edited = true;

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

    saveChannel();
}

function updatePoint(i) {
    channelData.edited = true;

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
var holder = document.getElementById("myChart");
var ctx = document.getElementById("myChart").getContext("2d");
var progress = document.getElementById('animationProgress');
var processStop = false;

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

document.getElementById("start").addEventListener("click", function () {
    if (isAnyCheckedProcessAlive()) {
        alert("Can not to start process for already alive channel");
        return;
    }
    let checkedChannels = getCheckedChannels();
    $.ajax({
        url: "/start_button",
        type: "POST",
        success: function (data) {
            saveChannels(checkedChannels);
            // processInfo = data;
            setProcessInfo(data);
            checkedChannels.forEach(channel => waitForKillProcess(channel));
            updateButtons();
        },
        contentType: "application/json",
        data: JSON.stringify({"schedule": getSchedule(), "channels": checkedChannels})
    });
});

document.getElementById("stop").addEventListener("click", function () {
    $.ajax({
        url: "/stop_button",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"channels": getCheckedChannels()}),
        success: function (data) {
            if (data === "OK") {
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
            display: true
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
            mode: 'single',
            callbacks: {
                title: function (tooltipItems, data) {
                    let item = tooltipItems[0];
                    return "Index: " + (item.index + 1) + "\nInterval: " + timeFromMinutes(getSchedule()[item.index].x);
                },
                label: function (tooltipItems, data) {
                    return tooltipItems.yLabel + " pH";
                },
                footer: function () {
                    return "(CTRL + LPM to add point)\n(SHIFT + LPM to delete point)"
                }
            }
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
    updateData();
}

function animationStart(process) {
    resetAnimation();
    // processStop = false;

    let time = (process.process.start) * 1000 + (new Date().getTime() - process.startTime);
    let maxTime = process.process.time * 1000;
    animationInterval = window.setInterval(function () {
        progress.value = 0.003 + (time / maxTime);
        if (progress.value >= 1) {
            stopAnimation();
        }

        time += 10;
    }, 10);

    // startAnimation(progress, process.process.start * 1000, process.process.time * 1000, 10);
}

function startAnimation(element, time, maxTime, offset) {
    console.log("TESt");
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
    progress.value = 0;
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
    label.textContent = "channel" + index;

    input.onchange = onchange;

    node.appendChild(input);
    node.appendChild(label);

    return node;
}

function selectChannel(index) {
    currentChannel = index;
    console.log("select channel " + index);
    localStorage.setItem("current.channel", index);
    document.getElementById("channelId").textContent = index;
    updateButtons();
    loadChannel(index);
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
        alert("You can not load template for current channels, because channel is alive!");
        return;
    }
    if (getData().length > 0 && !confirm("Are you sure you want to load the new template? The current chart will be replaced.")) {
        return;
    }
    $.get("/getTemplateSchedule", {templateName: selectedTemplate}).done(function (data) {
        // var schedule = data.schedule.map(x => {
        //     return {x: x.interval, y: x.pH};
        // });
        channelData.name = selectedTemplate;
        channelData.edited = false;

        let schedule = data.schedule;
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
    let data = JSON.parse(item);
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
    console.log("xd");

    let alive = isProcessAlive(currentChannel);
    document.getElementById("start").hidden = alive;
    document.getElementById("stop").hidden = !alive;
    document.getElementById("outerProgress").className = alive ? "outerProgress start" : "outerProgress";

    document.getElementById("channelCheckTitle").textContent = alive ? "Stop this schedule for channels:" : "Start this schedule for channels:";

    let radios = document.getElementById('channelRadios');
    let checkboxes = document.getElementById('channelCheckboxes');
    radios.innerHTML = "";
    checkboxes.innerHTML = "";
    for (let i = 0; i < numberOfChannels; i++) {
        radios.appendChild(createChannelInput("channelDiv" + i, i, "channel" + i, "radio", "channel", function () {
                selectChannel(i);
            }
        ));
        let checkDiv = createChannelInput("checkDiv" + i, i, "check" + i, "checkbox", "check");
        checkboxes.appendChild(checkDiv);

        let processAlive = isProcessAlive(i);
        checkDiv.hidden = !((alive && processAlive) || (!alive && !processAlive));
    }
    document.getElementById("check" + currentChannel).checked = true;
    document.getElementById("check" + currentChannel).disabled = true;

    document.getElementById("channel" + currentChannel).checked = true;

    resetAnimation();
    if (alive) {
        let process = processInfo[currentChannel];
        animationStart(process);
    }
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
    $.get("/process_alive", function (data) {
        // processInfo = data;
        setProcessInfo(data);
        Object.keys(processInfo).forEach((channel) => waitForKillProcess(channel));
        updateButtons();
    });
    selectChannel(currentChannel);
    loadListOfTemplates();
}

function parseSchedule() {
    var schedule = [];

    var n = table.rows[0].cells.length;
    for (var i = 1; i < n; i++) {
        let point = {
            x: Math.max(parseTimeToMinutes(table.rows[2].cells[i].children[0].value), 1),
            y: parseFloat(table.rows[1].cells[i].children[0].value)
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
            y: parseFloat(table.rows[1].cells[i].children[0].value)
        };
        data.push(point);
        lastTime = point.x;
    }
    return data;
}
