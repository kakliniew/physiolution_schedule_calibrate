import os

import yaml
from flask import Flask, jsonify
from flask import render_template
from flask import request

from functions import startProcess, cal1Function, cal2Function, \
    calibrateFunction, save_to_json, getTemp, saveDataToConfFromCablibrateButton, \
    getNumberOfChannels, loadSchedule, waitForProcess, killProcess, getProcessList

with open('configuration.yaml') as f:
    data = yaml.load(f, Loader=yaml.FullLoader)

app = Flask(__name__)

@app.route("/time_chart", methods=['GET'])
def time_chart():
    numberOfChannels = getNumberOfChannels(data)
    legend = 'pH'

    return render_template('time_chart.html', legend=legend, numberOfChannels=numberOfChannels, data=data)


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
    return {"schedule": loadSchedule("./schedules/"+request.args.get("templateName"))}


@app.route("/start_button", methods=["POST"])
def startButton():
    name = "last_schedule"
    description = "last run schedule for one of channels"

    channels = request.get_json()["channels"]
    schedule = request.get_json()["schedule"]
    save_to_json('schedule.json', name, description, schedule)
    for channel in channels:
        startProcess(schedule, channel)
    return jsonify(getProcessList())

@app.route("/process_alive", methods=["GET"])
def processAlive():
    return jsonify(getProcessList())
    # return {"alive": isProcessAlive(), "process": getProcess()}

@app.route("/wait_process", methods=["POST"])
def waitProcess():
    channel = request.get_json()["channel"]
    waitForProcess(channel)
    return {"status": "OK", "channels": getProcessList()}

@app.route("/stop_button", methods=["POST"])
def stopButton():
    channels = request.get_json()["channels"]

    for channel in channels:
        killProcess(channel)
    return "OK"

    
@app.route("/deleteTemplate", methods=["GET"])
def deleteTemplate():
    os.remove("./schedules/"+str(request.args.get("templateName")))
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

    return "template_saved"

@app.route("/calibrate", methods=['POST', 'GET'])
def calibrate():
    if request.method == 'POST':

        if request.form['cal_button'] == 'cal1':
            cal1Function()
            return "cal1"
        elif request.form['cal_button'] == 'cal2':
            cal2Function()
            return "cal2"
        elif request.form['cal_button'] == 'calibrate':
            dt_string = saveDataToConfFromCablibrateButton(request, data)
            calibrateFunction()
            return dt_string
        elif request.form['cal_button'] == 'update':
            with open('configuration.yaml') as f:
                dataTemp = yaml.load(f, Loader=yaml.FullLoader)
            print(data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'])

            return str(data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'])
        elif request.form['cal_button'] == 'sendTemp':
            return getTemp(data)
        elif request.form['cal_button'] == 'deviation':
            returned_value = 5
            return str(returned_value)
    elif request.method == 'GET':

        return render_template('calibrate.html', data=data)


if __name__ == "__main__":
    app.run(threaded=True)
