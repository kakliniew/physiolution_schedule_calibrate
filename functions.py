import json
import subprocess
from subprocess import Popen, PIPE
from subprocess import check_output
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
    
def getLabelsAndValuesFromJson(filename):
        try:
            with open(filename) as json_file:
                data = json.load(json_file)
                receivedValues = [ [value['pH']] for value in data['schedule']]
                receivedLabels =  [ [label['interval']] for label in data['schedule']]
                
                #for index in range(len(receivedLabels)):
                        #receivedLabels[index]= str(timedelta(seconds=int(receivedLabels[index])))
                
        except: 
             receivedValues = []
             receivedLabels = []
        #print(receivedLabels[index])
                
        return receivedLabels, receivedValues