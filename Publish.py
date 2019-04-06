import paho.mqtt.client as mqtt
import random,json
from datetime import datetime
from time import sleep

MQTT_Broker = "localhost"
MQTT_Port = 1883
Keep_Alive_Interval = 45 #thoi gian giua cac lan gui goi tin
MQTT_Topic1 = "home/sensors/datetime"
MQTT_Topic2 = "home/sensors/temperature"
MQTT_Topic3 = "home/sensors/humidity"
MQTT_Topic4 = "home/sensors/illumination"

#ham connect den host MQTT

def on_connect(client, userdata, rc):
	if rc !=0:
		pass
		print("Unable to connect to MQTT ")
	else:
		print("Connect with MQTT Broker: " + str(MQTT_Broker))
def on_publish(client, userdata, mid):
	pass
def on_disconnect(client, userdata, rc):
	if rc !=0:
		pass

mqttc = mqtt.Client()
mqttc.username_pw_set(username="huynam", password="huynam")
mqttc.on_connect = on_connect
mqttc.on_disconnect = on_disconnect
mqttc.on_publish = on_publish
mqttc.connect(MQTT_Broker, MQTT_Port, Keep_Alive_Interval)


def publish_To_Topic(topic, message):
	mqttc.publish(topic,message)
	print(("Published: " + str(message) + " " + "on MQTT Topic: " + str(topic)))
	print("")

#FAKE RANDOM SENSOR
def publish_fake_sensor_values_to_MQTT():
	Humidity_Fake_Value = int(random.uniform(50,100))	
	Temperature_Fake_Value = int(random.uniform(20,30))
	Illumination = int(random.uniform(20,1000))
	Sensor_data = {}  
	Sensor_data['Sensor_ID'] = "DHT-11"
	Sensor_data['Date'] = (datetime.today()).strftime("%Y-%m-%d %H:%M:%S")
	print("Publishing fake id : ");
	sensor_json_data = json.dumps(Sensor_data)
	publish_To_Topic(MQTT_Topic1,sensor_json_data)

	Sensor_data = {}
	Sensor_data['Temperature'] = Temperature_Fake_Value
	print("Publishing fake temperature Value: ");
	sensor_json_data = json.dumps(Sensor_data)
	publish_To_Topic(MQTT_Topic2,sensor_json_data)

	Sensor_data = {}
	Sensor_data['Humidity'] = Humidity_Fake_Value
	print("Publishing fake humidity Value: ");
	sensor_json_data = json.dumps(Sensor_data)
	publish_To_Topic(MQTT_Topic3,sensor_json_data)

	Sensor_data = {}
	Sensor_data['Illumination'] =Illumination 
	print("Publishing fake humidity Value: ");
	sensor_json_data = json.dumps(Sensor_data)
	publish_To_Topic(MQTT_Topic4,sensor_json_data)
	
while True:
	publish_fake_sensor_values_to_MQTT()
	sleep(3)

