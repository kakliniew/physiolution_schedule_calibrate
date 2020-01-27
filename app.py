import os

import yaml
from flask import Flask, jsonify
from flask import render_template
from flask import request

from functions import *

# with open('configuration.yaml') as f:
#     data = yaml.load(f, Loader=yaml.FullLoader)

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False


@app.route("/", methods=['GET'])
def time_chart():
    data = loadDataFromConfiguration()

    numberOfChannels = getNumberOfChannels(data)
    legend = 'pH'

    return render_template('time_chart.html', data=data, legend=legend, numberOfChannels=numberOfChannels,
                           grafana_url=data["grafana"]["url"])


@app.route("/schedule", methods=["GET"])
def getSchedule():
    return {"schedule": loadSchedule("schedule.json")}


@app.route("/schedules", methods=["GET"])
def getListOfSchedules():
    path = './schedules/'

    files = []
    for r, d, f in os.walk(path):
        files.extend(f)
    return jsonify(files)


@app.route("/getTemplateSchedule", methods=["GET"])
def getTemplateSchedule():
    return {"schedule": loadSchedule("./schedules/" + request.args.get("templateName"))}


@app.route("/start_button", methods=["POST"])
def startButton():
    name = "last_schedule"
    description = "last run schedule for one of channels"

    channels = request.get_json()["channels"]
    schedule = convertScheduleToSeconds(request.get_json()["schedule"])
    save_to_json('schedule.json', name, description, schedule)
    for channel in channels:
        startProcess(schedule, channel)
    return jsonify(getProcessList())


@app.route("/start_selected_button", methods=["POST"])
def startSelectedButton():
    name = "last_schedule"
    description = "last run schedule for one of channels"

    channels = request.get_json()["channels"]
    schedule = convertScheduleToSeconds(request.get_json()["schedule"])
    selected_point = request.get_json()["selected_point"]
    save_to_json('schedule.json', name, description, schedule[(selected_point + 1):])
    for channel in channels:
        startProcess(schedule, channel, selected_point)
    return jsonify(getProcessList())


@app.route("/start_monitoring", methods=["POST"])
def start_monitoring():
    channel = request.get_json()["channel"]
    startMonitoring(channel)
    return jsonify(getMonitoring())


@app.route("/stop_monitoring", methods=["POST"])
def stop_monitoring():
    channel = request.get_json()["channel"]
    stopMonitoring(channel)
    return jsonify(getMonitoring())


@app.route("/monitoring", methods=["GET"])
def monitoring():
    return jsonify(getMonitoring())


@app.route("/process_alive", methods=["GET"])
def processAlive():
    process_list = getProcessList()
    process_list["monitoring"] = getMonitoring()
    return jsonify(process_list)
    # return {"alive": isProcessAlive(), "process": getProcess()}


@app.route("/wait_process", methods=["POST"])
def waitProcess():
    channel = request.get_json()["channel"]
    waitForProcess(channel)
    status = "IDK"
    process = getProcess(channel)
    if "stop" in process and process["stop"]:
        status = "STOP"
    elif "pause" in process and process["pause"]:
        status = "PAUSE"
    return {"status": status, "channels": getProcessList()}


@app.route("/stop_button", methods=["POST"])
def stopButton():
    channels = request.get_json()["channels"]

    for channel in channels:
        killProcess(channel)
    return "OK"


@app.route("/pause_button", methods=["POST"])
def pauseButton():
    channel = request.get_json()["channel"]
    pauseProcess(channel)

    return "OK"


@app.route("/resume_button", methods=["POST"])
def resumeButton():
    channel = request.get_json()["channel"]

    resumeProcess(channel)
    return jsonify(getProcessList())


@app.route("/deleteTemplate", methods=["GET"])
def deleteTemplate():
    os.remove("./schedules/" + str(request.args.get("templateName")))
    return "worked"


@app.route("/saveTemplate", methods=["POST"])
def saveTemplate():
    # now = datetime.now()
    # dt_string = now.strftime("%d-%m-%Y-%H-%M-%S")

    name = request.get_json()["name"]
    description = request.get_json()["description"]
    schedule = request.get_json()["schedule"]

    # save_to_json('./schedules/schedule_'+dt_string+'.json', name, description, schedule)
    save_to_json('./schedules/' + name + '.json', name, description, schedule)

    return str(name)


@app.route("/calibrate_time", methods=["GET"])
def calibrateTime():
    data = loadDataFromConfiguration()

    return data


@app.route("/calibrate_data", methods=["GET"])
def calibrateData():
    data = loadDataFromConfiguration()

    return jsonify(data["calibration"]["ph"])


@app.route("/sensor_data", methods=["GET"])
def sensorData():
    channel = request.args["channel"]
    sensor_data = getSensorData(int(channel))

    data = loadDataFromConfiguration()
    sensor_data["default_temperature"] = data["interface"]["ph1"]
    return sensor_data


@app.route("/calibrate", methods=['POST', 'GET'])
def calibrate():
    if request.method == 'POST':

        if request.form['cal_button'] == 'cal1':
            cal1Function(int(request.form["channel"]))
            return "cal1"
        elif request.form['cal_button'] == 'cal2':
            cal2Function(int(request.form["channel"]))
            return "cal2"
        elif request.form['cal_button'] == 'calibrate':
            data = loadDataFromConfiguration()
            dt_string = saveDataToConfFromCablibrateButton(request, data)
            calibrateFunction(int(request.form["channel"]))
            return dt_string
        elif request.form['cal_button'] == 'update':
            # with open('configuration.yaml') as f:
            #     dataTemp = yaml.load(f, Loader=yaml.FullLoader)
            data = loadDataFromConfiguration()
            # print(data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'])

            return str(data['calibration']['ph'][request.form["channel"]]['Tcal'])
        elif request.form['cal_button'] == 'sendTemp':
            data = loadDataFromConfiguration()
            return getSensorTemperature(data)
        elif request.form['cal_button'] == 'deviation':
            returned_value = 5
            return str(returned_value)
    elif request.method == 'GET':
        data = loadDataFromConfiguration()
        numberOfChannels = getNumberOfChannels(data)
        return render_template('calibrate.html', data=data, numberOfChannels=numberOfChannels)


if __name__ == "__main__":
    app.run(host="0.0.0.0", threaded=True)
