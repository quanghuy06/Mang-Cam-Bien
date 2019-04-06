import paho.mqtt.client as mqtt
import ast

MQTT_Broker = "localhost"
MQTT_Port   = 1883
Keep_Alive_Interval = 45
MQTT_Topic4 = "longvh_test"

SensorID ="dht11" 
Date_and_Time ="123" 
Temperature =0 
Humidity =0 
cnt_check = 0


def on_message(client, userdata, msg):
	global SensorID , Date_and_Time, Temperature, Humidity, cnt_check
	print ("MQTT Topic : "+ msg.topic)
	print ("DATA : " + str(msg.payload))
	print ("saving .....")


def on_connect(client, userdata, flags, rc):
	if rc != 0: #ket noi thanh cong khi rc = 0
		pass
		print("Unable to connect to MQTT Broker...")
	else:
		print("Connected with MQTT Broker: " + str(MQTT_Broker))
	client.subscribe(MQTT_Topic4,0)


client = mqtt.Client()
client.username_pw_set(username="long",password="1")
client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_Broker, MQTT_Port, Keep_Alive_Interval)
client.loop_forever()

