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


def get_shell_script_output_using_check_output():
    bashCommand = "ping www.wp.pl"
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()
    print("excetude")


def terminate_subprocess(process):
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    print("terminate")


def cal1Function():
    print("cal1")


def cal2Function():
    print("cal2")


def calibrateFunction():
    print("calibration")


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

            return data['schedule']
    except:
        return {}


def save_to_json(filename, chartname, chartdescription, request):
    name = chartname
    description = chartdescription

    schedule = request.get_json()["schedule"]

    JsonToPrint = {'name': name, 'description': description,
                   'schedule': [{'interval': data["x"], "pH": data["y"]} for data in schedule]}
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
