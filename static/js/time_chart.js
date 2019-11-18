// Global parameters:
let currentChannel = localStorage.getItem("current.channel");
if (currentChannel !== null) {
    currentChannel = parseInt(currentChannel);
} else {
    currentChannel = 0;
}

// function assertChannel() {
//     if (currentChannel === null) {
//         alert("Najpierw musisz wybrać kanal")
//         return true;
//     }
//     return false;
// }

// do not resize the chart canvas when its container does (keep at 600x400px)
Chart.defaults.global.responsive = true;
var tbl = document.getElementById("tblData");
var timeFormat = 'HH:mm';
var colCount = tbl.rows[0].cells.length;
var rowCount = tbl.rows.length;

function timeFromMinutes(minutes) {
    return newDateString(Math.floor(minutes / 60), minutes % 60);
}

function newDateString(hours, minutes) {
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}

function parseTimeToMinutes(value) {
    let split = value.split(":");
    return (parseInt(split[0]) * 60) + parseInt(split[1]);
}

function updateIndex() {
    for (var i = 1; i < tbl.rows[0].cells.length; i++) {
        tbl.rows[0].cells[i].innerHTML = i;
    }
}

function getLastPoint() {
    var data = myChart.data.datasets[0].data;
    if (data.length > 0) {
        return data[data.length - 1];
    }
    return null;
}

function insertPointBefore(index) {
    var data = myChart.data.datasets[0].data;
    if (data.length <= index) {
        return;
    }
    var oldPoint = data[index];
    var beforePoint = data.length >= index ? data[index - 1] : undefined;
    var newPoint = {
        x: oldPoint.x - 10,
        y: oldPoint.y
    };
    if (beforePoint !== undefined && beforePoint.x > newPoint.x) {
        newPoint.x = beforePoint.x;
    }
    if (oldPoint.x < 0) {
        oldPoint.x = 0;
    }
    insertSpecificPointBefore(index, newPoint);
}

function insertSpecificPointBefore(index, newPoint) {
    var data = myChart.data.datasets[0].data;
    if (data.length <= index) {
        return;
    }

    insertBefore(0, index + 1, $("<td>" + index + "</td>")[0]);
    insertBefore(1, index + 1, $("<td>").append($(generateInput(newPoint.y, false)))[0]);
    insertBefore(2, index + 1, $("<td>").append($(generateInput(timeFromMinutes(newPoint.x), true)))[0]);

    data.splice(index, 0, newPoint);

    updateIndex();
}

function insertBefore(row, index, element) {
    let currentElement = tbl.rows[row].cells[index];
    currentElement.parentNode.insertBefore(element, currentElement);
}

function removePoint(index) {
    tbl.rows[2].cells[index + 1].remove();
    tbl.rows[1].cells[index + 1].remove();
    tbl.rows[0].cells[index + 1].remove();

    myChart.data.datasets[0].data.splice(index, 1);
    updateIndex();
}

function setPoint(index, point) {
    tbl.rows[2].cells[index + 1].children[0].value = timeFromMinutes(Math.round(point.x));
    tbl.rows[1].cells[index + 1].children[0].value = point.y;
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
        data: JSON.stringify({schedule: transformData()}),
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
    addValue();
    reloadChart()
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
                return;
            } else if (index < data.length - 1 && data[index + 1].x < value.x) {
                value.x = data[index + 1].x;
                return;
            }
            setPoint(index, value);
        },
        onDragEnd: function (e, datasetIndex, index, value) {
            reloadChart();
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
        insertPointBefore(activePoint[0]._index);
        reloadChart();
    } else if (activePoint.length > 0 && evt.shiftKey) {
        removePoint(activePoint[0]._index);
        reloadChart();
    } else if (activePoint.length > 0) {
        console.log(activePoint);
        console.log('x:' + activePoint[0]._view.x);
        console.log('maxWidth: ' + activePoint[0]._xScale.maxWidth);
        console.log('y: ' + activePoint[0]._view.y);
        console.log('index: ' + activePoint[0]._index);
        pointSelected.innerHTML = 'Point selected... index: ' + (activePoint[0]._index + 1);
    }
};

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

function generateInput(value, time) {
    let input = document.createElement("input");
    input.className = "time-input";
    input.size = "1";
    input.type = "text";
    input.value = value;
    input.onchange = function () {
        reloadChart();
    };
    return input;
}

function addValue() {

    $("#tblData").find('tr').each(function () {
        var trow = $(this);
        if (trow.index() === 0) {
            trow.append("<td>" + cellLength() + "</td>");
        } else {

            var input;
            if (trow.index() === 1) {
                input = generateInput(cellLength() > 2 ? "7.00" : "0", false);
            } else {
                input = generateInput(cellLength() > 2 ? timeFromMinutes(parseTimeToMinutes(tbl.rows[2].cells[cellLength() - 2].children[0].value) + 10) : "00:00", true);
            }
            trow.append($("<td>").append($(input)));
        }
    });
}

function cellLength() {
    return tbl.rows[0].cells.length;
}

function reloadChart() {
    let data = parseData();
    let oldData = myChart.data.datasets[0].data;
    for (var i = 0; i < data.length; i++) {
        if (i > 0 && data[i - 1].x > data[i].x) {
            data[i].x = oldData[i].x;
            setPoint(i, data[i]);
        } else if (i < data.length - 1 && data[i + 1].x < data[i].x) {
            data[i].x = oldData.length <= i ? 0 : oldData[i].x;
            setPoint(i, data[i]);
        }
    }
    myChart.data.datasets[0].data = data;
    myChart.update();

    saveChannel();
}

function clearChart() {
    console.log("clear chart");
    var row1 = document.getElementById("firstRow");
    var row2 = document.getElementById("secondRow");
    var row3 = document.getElementById("thirdRow");

    var size = cellLength();
    for (var i = 1; i < size; i++) {
        row1.deleteCell(1);
        row2.deleteCell(1);
        row3.deleteCell(1);
    }

    myChart.data.datasets[0].data = [];
    myChart.update();
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

        clearChart();

        var actualTime = 0;
        for (var i = 0; i < schedule.length; i++) {
            addValue();
            actualTime += schedule[i].x;
            setPoint(i, {
                x: actualTime,
                y: schedule[i].y
            });
        }
        reloadChart();
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
        data: JSON.stringify({schedule: transformData(), name: templateName, description: templateDescription})
    });
    loadListOfTemplates();
}

function loadChannel(index) {
    let item = localStorage.getItem("channel." + index);

    clearChart();
    if (!item) {
        return;
    }
    let channel = JSON.parse(item);

    for (var i = 0; i < channel.length; i++) {
        addValue();
        setPoint(i, {
            x: channel[i].x,
            y: channel[i].y
        });
    }
    reloadChart();
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
    // loadChartFromFile();
    selectChannel(currentChannel);
    loadListOfTemplates();
}

function parseData() {

    var schedule = [];

    var n = tbl.rows[0].cells.length;
    for (var i = 1; i < n; i++) {
        let point = {
            x: parseTimeToMinutes(tbl.rows[2].cells[i].children[0].value),
            y: parseFloat(tbl.rows[1].cells[i].children[0].value)
        };
        schedule.push(point);
    }
    return schedule;
}

function transformData() {
    let data = parseData();

    let lastValue = 0;
    for (var i = 0; i < data.length; i++) {
        let currentValue = data[i].x;
        data[i].x = currentValue - lastValue;
        lastValue = currentValue;
    }

    return data;
}
