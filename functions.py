from flask import Flask
from flask import render_template
from flask import request
from datetime import datetime, timedelta
from time import strftime
from time import gmtime
import subprocess
from subprocess import Popen, PIPE
from subprocess import check_output
import os
import signal
import yaml
import json
import time
import copy

process = {}
monitoring = []

def isProcessAlive(channel):
    global process

    return channel in process and process[channel]["process"].poll() is None


def getProcess(channel):
    global process

    if channel in process:
        if "pause" in process[channel]["data"] and process[channel]["data"]["pause"]:
            process[channel]["data"]["start"] = process[channel]["data"]["pauseTime"] - process[channel]["data"]["startTime"]
        else:
            process[channel]["data"]["start"] = time.time() - process[channel]["data"]["startTime"]
        return process[channel]["data"]
    return None


def waitForProcess(channel):
    global process

    if isProcessAlive(channel):
        try:
            output, err = process[channel]["process"].communicate()
        except:
            pass
    print("process is done")


def startProcess(schedule, channel, selected_point=-1):
    global process

    endTime = 0
    for s in schedule:
        endTime += s["x"]

    startTime = 0
    for s in range(0, selected_point + 1):
        startTime += schedule[s]["x"]

    # bashCommand = "ping www.wp.pl"
    bashCommand = "sleep {}s".format(endTime - startTime) # TOREPLACE START
    print(bashCommand)
    if not isProcessAlive(channel):
        process[channel] = {
            "process": subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE),
            "data": {
                "startTime": time.time() - startTime,
                "start": startTime,
                "time": endTime
            },
            "schedule": schedule[(selected_point + 1):]
        }
    print("executed")

def convertScheduleToSeconds(schedule):
    return [{"x": x["x"] * 60, "y": x["y"]} for x in schedule]

def resumeProcess(channel):
    global process

    getProcess(channel) # musi zostać, bo liczy nowy start time

    cut_time = 0
    start_time = int(process[channel]["data"]["start"])
    schedule = copy.deepcopy(process[channel]["schedule"])

    while cut_time < start_time and len(schedule) > 0:
        if cut_time + schedule[0]["x"] <= start_time:
            cut_time += schedule[0]["x"]
            schedule = schedule[1:]
        else:
            schedule[0]["x"] -= start_time - cut_time
            cut_time += start_time - cut_time

    name = "last_schedule"
    description = "last run schedule for one of channels"
    save_to_json('schedule.json', name, description, schedule)

    bashCommand = "sleep {}s".format(process[channel]["data"]["time"] - start_time) # TOREPLACE START
    print(bashCommand)
    if isProcessAlive(channel):
        process[channel]["process"].kill()
        # process[channel]["process"].communicate()
    if not isProcessAlive(channel):
        process[channel]["data"]["pause"] = False
        process[channel]["data"]["startTime"] = time.time() - start_time
        process[channel]["process"] = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    print("executed")

def pauseProcess(channel):
    global process

    process[channel]["data"]["pause"] = True
    process[channel]["data"]["pauseTime"] = time.time()

    getProcess(channel)  # musi zostać, bo liczy nowy start time

    cut_time = 0
    start_time = int(process[channel]["data"]["start"])
    schedule = copy.deepcopy(process[channel]["schedule"])

    while cut_time < start_time and len(schedule) > 0:
        if cut_time + schedule[0]["x"] <= start_time:
            cut_time += schedule[0]["x"]
            schedule = schedule[1:]
        else:
            schedule[0]["x"] -= start_time - cut_time
            cut_time += start_time - cut_time

    if len(schedule) > 0:
        schedule[0]["x"] = 60 * 60 * 60 * 24

    name = "last_schedule"
    description = "last run schedule for one of channels"
    save_to_json('schedule.json', name, description, schedule)
    bashCommand = "sleep {}s".format(process[channel]["data"]["time"] - start_time) # TOREPLACE START
    if isProcessAlive(channel):
        process[channel]["process"].kill()
        # process[channel]["process"].communicate()
    process[channel]["process"] = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    

def killProcess(channel):
    global process

    if isProcessAlive(channel):
        process[channel]["data"]["stop"] = True
        process[channel]["process"].kill()
        # process[channel]["process"].communicate()


def getProcessList():
    global process

    data = {}
    for channel in process:
        data[channel] = {"alive": isProcessAlive(channel), "process": getProcess(channel)}

    return data


def startMonitoring(channel):
    global monitoring

    monitoring.append(channel)


def stopMonitoring(channel):
    global monitoring
    monitoring.remove(channel)


def getMonitoring():
    global monitoring

    return monitoring


def terminate_subprocess(process):
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    print("terminate")


def cal1Function(channel):
    print("cal1")
    print("channel", channel)


def cal2Function(channel):
    print("cal2")
    print("channel", channel)


def calibrateFunction(channel):
    print("calibration")
    print("channel", channel)


def getSensorTemperature(channel) -> int:
    return 5 * channel


def getSensorData(channel):
    temperature = int(getSensorTemperature(channel))

    return {"active": (0 < temperature < 100), "temperature": temperature}


def getLabelsAndValuesFromJson(filename):
    try:
        with open(filename) as json_file:
            data = json.load(json_file)
            receivedValues = [[value['pH']] for value in data['schedule']]
            receivedLabels = [[label['interval']] for label in data['schedule']]

            for index in range(len(receivedLabels)):
                receivedLabels[index] = str(strftime("%H:%M", gmtime(receivedLabels[index][0])));
                print(receivedLabels[index])
    except:
        receivedValues = []
        receivedLabels = []
    # print(receivedLabels[index])

    return receivedLabels, receivedValues


def loadSchedule(filename):
    try:
        with open(filename) as json_file:
            data = json.load(json_file)
            schedule = data["schedule"]
            print(schedule)
            data = [{"x": element["interval"] / 60, "y": element["pH"]} for element in schedule]
            return data
    except:
        return {}


def loadDataFromConfiguration():
    with open('configuration.yaml', 'r') as f:
        return yaml.safe_load(f)


def save_to_json(filename, chartname, chartdescription, schedule):
    name = chartname
    description = chartdescription

    JsonToPrint = {'name': name, 'description': description,
                   'schedule': [{'interval': data["x"], "pH": float(data["y"])} for data in
                                schedule]}
    print(JsonToPrint)
    with open(filename, 'w') as outfile:
        json.dump(JsonToPrint, outfile, indent=4)


def saveDataToConfFromCablibrateButton(request, data):
    now = datetime.now()
    dt_string = now.strftime('%d-%m-%Y %H:%M')
    data['calibration']['ph'][int(request.form["channel"])+1]['Tcal'] = float(request.form['temperature'])
    data['calibration']['ph'][int(request.form["channel"])+1]['pH1'] = float(request.form['ph1'])
    data['calibration']['ph'][int(request.form["channel"])+1]['pH2'] = float(request.form['ph2'])
    data['calibration']['ph'][int(request.form["channel"])+1]['date'] = dt_string
    with open('configuration.yaml', 'w') as f:
        yaml.dump(data, f)
    return dt_string


def getNumberOfChannels(data):
    return (len(data['calibration']['ph']) - 1)

# def getTemp(data):
#     if float(request.form['temp']) > float(data['interface']['temperatureMax']) or float(request.form['temp']) < float(
#             data['interface']['temperatureMin']):
#         data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'] = data['interface']['temperatureDefault']
#     else:
#         data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'] = request.form['temp']
#     with open('configuration.yaml', 'w') as f:
#         yaml.dump(data, f)
#     return str(data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'])
