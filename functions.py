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

from process import *

# process_manager = ProcessManager()
# process = {}
monitoring = []

def startMonitoring(channel):
    global monitoring

    monitoring.append(channel)


def stopMonitoring(channel):
    global monitoring
    monitoring.remove(channel)


def getMonitoring():
    global monitoring

    return monitoring


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