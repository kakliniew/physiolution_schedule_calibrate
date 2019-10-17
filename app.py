from flask import Flask
from flask import render_template
from flask import request
from datetime import datetime, timedelta

import subprocess
from subprocess import Popen, PIPE
from subprocess import check_output
import os
import signal
import yaml
import json


with open('configuration.yaml') as f:
    
    data = yaml.load(f, Loader=yaml.FullLoader)
   
print(data['calibration']['ph']['default_cal']['ph1'])

app = Flask(__name__)

bashCommand ="mkdir -p kar"
process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)


@app.route("/time_chart", methods=['POST', 'GET'])
def time_chart():

   
    legend = 'pH'
  
    if request.method == 'POST':
       
        if request.form['start_button'] == 'Start':
            name = "alamakota"
            description = "descr"
            
            receivedValues = request.form.getlist('values[]')
            receivedLabels = request.form.getlist('labels[]')
            for index in xrange(len(receivedLabels)):
                receivedLabels[index]= datetime.strptime(receivedLabels[index],"%H:%M:%S")
                receivedLabels[index] = timedelta(hours=receivedLabels[index].hour, minutes = receivedLabels[index].minute, seconds = receivedLabels[index].second)
                print(receivedLabels[index] .total_seconds())
            print(receivedLabels[2].total_seconds())
            
            JsonToPrint  = {'name' : name, 'description' : description, 'schedule' : [{'interval': label.total_seconds(), 'pH' : value} for label,value in zip(receivedLabels, receivedValues)]}
            print(JsonToPrint)
            with open('schedule.txt', 'w') as outfile:
                json.dump(JsonToPrint, outfile, indent =4)
            
            get_shell_script_output_using_check_output()
            return "command executed"
        elif request.form['start_button'] == 'Stop':
            terminate_subprocess()
            return "process terminated"
        else:
            pass # unknown
    elif request.method == 'GET':
        return render_template('time_chart.html', legend=legend)

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
  
            now = datetime.now()
            dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
            data['calibration']['ph']['chan'+request.form["channel"]]['a'] =request.form['ph1'] 
            data['calibration']['ph']['chan'+request.form["channel"]]['b'] = request.form['ph2'] 
            data['calibration']['ph']['chan'+request.form["channel"]]['date']  = dt_string
            with open('configuration.yaml', 'w') as f:
                yaml.dump(data, f)
                
            calibrateFunction()
            return dt_string
        elif request.form['cal_button'] == 'update':
            with open('configuration.yaml') as f:
                dataTemp = yaml.load(f, Loader=yaml.FullLoader)
            print(data['calibration']['ph']['chan'+request.form["channel"]]['Tcal'] )
         
            return str(data['calibration']['ph']['chan'+request.form["channel"]]['Tcal'] )
        elif request.form['cal_button'] == 'sendTemp':
            if float(request.form['temp'] )> float(data['interface']['temperatureMax']) or float(request.form['temp'] )< float(data['interface']['temperatureMin'] ):
                data['calibration']['ph']['chan'+request.form["channel"]]['Tcal'] =data['interface']['temperatureDefault'] 
            else:
                data['calibration']['ph']['chan'+request.form["channel"]]['Tcal']  =  request.form['temp'] 
            with open('configuration.yaml', 'w') as f:
                yaml.dump(data, f)
            return  str(data['calibration']['ph']['chan'+request.form["channel"]]['Tcal'])
        elif request.form['cal_button'] == 'deviation':
            returned_value = 5
            return str(returned_value)
    elif request.method == 'GET':
        return render_template('calibrate.html',  data=data)

def get_shell_script_output_using_check_output():
    bashCommand = "ping www.wp.pl"
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    output, error= process.communicate()
    print("excetude")
    
def terminate_subprocess():
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    print("terminate")
    
def cal1Function():
    print("cal1")

def cal2Function():
    print("cal2")
    
def calibrateFunction():
    print("calibration")
    
    
if __name__ == "__main__":
    app.run(threaded=True)

