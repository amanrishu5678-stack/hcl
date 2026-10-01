#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void connectMqtt() {
  while (!mqtt.connected()) {
    mqtt.connect(DEVICE_ID);
    delay(500);
  }
}

void setup() {
  Serial.begin(115200);
  connectWifi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["equipment_id"] = EQUIPMENT_ID;
  doc["timestamp"] = "runtime-generated";
  doc["temperature"] = 62.0;
  doc["vibration"] = 2.1;
  doc["current"] = 7.5;
  doc["voltage"] = 230.0;
  doc["pressure"] = 5.4;
  doc["rpm"] = 1450;
  doc["runtime_hours"] = 3821.0;

  char buffer[512];
  serializeJson(doc, buffer);
  String topic = String("industrial/") + EQUIPMENT_ID + "/telemetry";
  mqtt.publish(topic.c_str(), buffer, true);
  delay(2000);
}
