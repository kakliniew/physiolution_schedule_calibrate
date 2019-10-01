from flask import Flask
from flask import render_template
from flask import request
from datetime import datetime
import subprocess
from subprocess import Popen, PIPE
from subprocess import check_output
import os
import signal
import yaml


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
            
            print("cal1")
            return "cal1"
        elif request.form['cal_button'] == 'cal2':
            print("cal2")
            return "cal2"
        elif request.form['cal_button'] == 'calibrate':
            print("calibrate")
            now = datetime.now()
            dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
            
            data['calibration']['ph']['chan'+request.form["channel"]]['date']  = dt_string
            with open('configuration.yaml', 'w') as f:
                yaml.dump(data, f)
            return dt_string
        elif request.form['cal_button'] == 'update':
            with open('configuration.yaml') as f:
                dataTemp = yaml.load(f, Loader=yaml.FullLoader)
            print(dataTemp['calibration']['temperature'])
            return str(dataTemp['calibration']['temperature'])
        elif request.form['cal_button'] == 'sendTemp':
            if float(request.form['temp'] )> float(data['calibration']['temperatureMax']) or float(request.form['temp'] )< float(data['calibration']['temperatureMin'] ):
                data['calibration']['temperature'] =data['calibration']['temperatureDefault'] 
            else:
                data['calibration']['temperature'] =  request.form['temp'] 
            with open('configuration.yaml', 'w') as f:
                yaml.dump(data, f)
            return  str(data['calibration']['temperature'])
            
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
if __name__ == "__main__":
    app.run(threaded=True)

