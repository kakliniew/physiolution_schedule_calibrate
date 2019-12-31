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

process = {}

def isProcessAlive(channel):
    global process

    return channel in process and process[channel]["process"].poll() is None
    # return process != None and process["process"].poll() is None


def getProcess(channel):
    global process

    if channel in process:
        process[channel]["data"]["start"] = time.time() - process[channel]["data"]["startTime"]
        return process[channel]["data"]
    # if process is not None:
    #     process["data"]["start"] = time.time() - process["data"]["startTime"]
    #     return process["data"]
    return None


def waitForProcess(channel):
    global process

    print(channel)
    print(isProcessAlive(channel))
    if isProcessAlive(channel):
        try:
            output, err = process[channel]["process"].communicate()
        except:
            pass
    print("process is done")


def startProcess(schedule, channel):
    global process

    endTime = 0
    for s in schedule:
        endTime += s["x"] * 60

    # bashCommand = "ping www.wp.pl"
    bashCommand = "sleep {}s".format(endTime)
    print(bashCommand)
    if not isProcessAlive(channel):
        process[channel] = {
            "process": subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE),
            "data": {
                "startTime": time.time(),
                "start": 0,
                "time": endTime
            }
        }
    print("executed")


def killProcess(channel):
    global process

    if isProcessAlive(channel):
        process[channel]["process"].kill()

def getProcessList():
    global process

    data = {}
    for channel in process:
        data[channel] = {"alive": isProcessAlive(channel), "process": getProcess(channel)}

    return data


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


def save_to_json(filename, chartname, chartdescription, schedule):
    name = chartname
    description = chartdescription

    JsonToPrint = {'name': name, 'description': description,
                   'schedule': [{'interval': data["x"] * 60, "pH": data["y"]} for data in
                                schedule]}
    print(JsonToPrint)
    with open(filename, 'w') as outfile:
        json.dump(JsonToPrint, outfile, indent=4)


def saveDataToConfFromCablibrateButton(request, data):
    now = datetime.now()
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
    data['calibration']['ph']['chan' + request.form["channel"]]['a'] = request.form['ph1']
    data['calibration']['ph']['chan' + request.form["channel"]]['b'] = request.form['ph2']
    data['calibration']['ph']['chan' + request.form["channel"]]['date'] = dt_string
    with open('configuration.yaml', 'w') as f:
        yaml.dump(data, f)
    return dt_string


def getNumberOfChannels(data):
    return (len(data['calibration']['ph']) - 1)


def getTemp(data):
    if float(request.form['temp']) > float(data['interface']['temperatureMax']) or float(request.form['temp']) < float(
            data['interface']['temperatureMin']):
        data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'] = data['interface']['temperatureDefault']
    else:
        data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'] = request.form['temp']
    with open('configuration.yaml', 'w') as f:
        yaml.dump(data, f)
    return str(data['calibration']['ph']['chan' + request.form["channel"]]['Tcal'])
