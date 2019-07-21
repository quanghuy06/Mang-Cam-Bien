#include "DHT.h"  
#include <ESP8266WiFi.h>
#include <PubSubClient.h>


#define DHTPIN 5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
#define led1 D3
#define led2 D6
#define speaker D2
// Replace the next variables with your SSID/Password combination
const char* ssid = "HUAWEI nova 2i";
const char* password = "netbeanss";

const char* mqtt_server = "mqtt://postman.cloudmqtt.com";

WiFiClient espClient;
PubSubClient client(espClient);  

int sensor = A0;
int value = 0;
void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();
  if (String(topic) == "Topic 1") {
      Serial.print("setup led1 ");
      if (strcmp(messageTemp.c_str(),"true")==0)
        digitalWrite(led1,0);
      else 
        digitalWrite(led1,1);
      Serial.println(messageTemp);
  }
  if (String(topic) == "Topic 2") {
      Serial.print("setup led2 ");
      if (strcmp(messageTemp.c_str(),"true")==0) 
        digitalWrite(led2,1);
      else 
        digitalWrite(led2,0);
      Serial.println(messageTemp);
  }
  if (String(topic) == "Topic 3") {
      Serial.print("setup speaker pwm ");
      Serial.println(messageTemp.toInt());
      analogWrite(speaker,messageTemp.toInt());
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client","NguyenVinhHung","12345")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("Topic 1");
      client.subscribe("Topic 2");
      client.subscribe("Topic 3");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(1000);
    }
  }
}
void setup() {
  
 Serial.begin(115200);
 Serial.println("DHTxx test!");
 setup_wifi();
 client.setServer(mqtt_server, 1883);
 client.setCallback(callback);

 pinMode(led1,OUTPUT);
 pinMode(led2,OUTPUT);
 pinMode(sensor,INPUT);
 dht.begin();
 
}

void loop() 
{
  
 int value=analogRead(sensor);
 int humidity = dht.readHumidity();
 int temperature = dht.readTemperature();
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  char tempString[8];
  sprintf(tempString, "%d",temperature);
  Serial.print("  Temperature: ");
  Serial.print(tempString);
  client.publish("home/sensors/temperature", tempString);
  
  char humString[8];
  sprintf(humString, "%d", humidity);
  Serial.print("  Humidity: ");
  Serial.println(humString);
  client.publish("home/sensors/humidity", humString);

  char Illumination[8];
  sprintf(Illumination, "%d", value);
  Serial.print("  Value Light: ");
  Serial.println(Illumination);
  client.publish("home/sensors/illumination", Illumination);
  
  delay(2000);
}
