
    //#define ENABLE_DEBUG

    #ifdef ENABLE_DEBUG
    #define DEBUG_ESP_PORT Serial
    #define NODEBUG_WEBSOCKETS
    #define NDEBUG
    #endif

    #include <Arduino.h>
    #ifdef ESP8266
    #include <ESP8266WiFi.h>
    // needed for library
    #include <DNSServer.h>
    #include <ESP8266WebServer.h>
    #include <WiFiManager.h> //https://github.com/tzapu/WiFiManager
    #endif
    #ifdef ESP32
    #include <WiFi.h>
    #endif

    #include "SinricPro.h"
    #include "SinricProSwitch.h"

    #define WIFI_SSID ""
    #define WIFI_PASS ""
    #define APP_KEY "c8ca9f04-4f66-4c85-9518-1349f5a08eb1" // Should look like "de0bxxxx-1x3x-4x3x-ax2x-5dabxxxxxxxx"
    #define APP_SECRET "ff95cdbc-1ab5-4a44-9264-eb04d4293375-f699de8b-72b8-4a77-9108-1d2af26e6cb8" // Should look like "5f36xxxx-x3x7-4x3x-xexe-e86724a9xxxx-4c4axxxx-3x3x-x5xe-x9x3-333d65xxxxxx"

    #define SWITCH_ID_1 "6335406591890acd963dc71c" // Should look like "5dc1564130xxxxxxxxxxxxxx"
    #define SWITCH_ID_2 "6335406591890acd963dc71d" // Should look like "5dc1564130xxxxxxxxxxxxxx"
    
    #ifdef ESP8266
    #define TRIGGER_PIN D0
    #define SWITCHPIN_1 D1
    #define SWITCHPIN_2 D2

    bool portalRunning = false;
    WiFiManager wm;
    long unsigned int con = 31536000;
    
    #endif
    
    #define BAUD_RATE 9600 // Change baudrate to your need
    
    bool onPowerState1(const String &deviceId, bool &state)
    {
      Serial.printf("Device 1 turned %s\r\n", state ? "on" : "off");
      digitalWrite(SWITCHPIN_1, state ? HIGH : LOW);
      return true; // request handled properly
    }

    bool onPowerState2(const String &deviceId, bool &state)
    {
      Serial.printf("Device 2 turned %s\r\n", state ? "on" : "off");
      digitalWrite(SWITCHPIN_2, state ? HIGH : LOW);
      return true; // request handled properly
    }
    
    // setup function for WiFi connection
    void setupWiFi()
    {
      WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP
      // put your setup code here, to run once:
    
      Serial.println("\n Starting");
      pinMode(TRIGGER_PIN, INPUT_PULLUP);
    
      wm.setConnectTimeout(con);
    
      // String ssid = wm.getConfigPortalSSID();
      // Serial.printf("Failed to connect:", ssid);
    
      bool res;
      // res = wm.autoConnect(); // auto generated AP name from chipid
      // res = wm.autoConnect("AutoConnectAP"); // anonymous ap
      res = wm.autoConnect("PHONEPEHOME"); // password protected ap
    
      if (!res)
      {
        Serial.println("Failed to connect");
        // ESP.restart();
      }
    }
    
    // setup function for SinricPro
    void setupSinricPro()
    {
      pinMode(SWITCHPIN_1, OUTPUT);
      pinMode(SWITCHPIN_2, OUTPUT);
      //  add devices and callbacks to SinricPro
      SinricProSwitch &mySwitch1 = SinricPro[SWITCH_ID_1];
      mySwitch1.onPowerState(onPowerState1);

      SinricProSwitch &mySwitch2 = SinricPro[SWITCH_ID_2];
      mySwitch2.onPowerState(onPowerState2);
    
      // setup SinricPro
      SinricPro.onConnected([]()
                            { Serial.printf("Connected to Origin8\r\n"); });
      SinricPro.onDisconnected([]()
                               { Serial.printf("Disconnected from Origin8\r\n"); });
      SinricPro.begin(APP_KEY, APP_SECRET);
    }
    
    int timeout = 120; // seconds to run for
    void setup()
    {
      Serial.begin(BAUD_RATE);
      Serial.printf("\r\n\r\n");
    
      setupWiFi();
      setupSinricPro();
    }
    
    void loop()
    {
      if (digitalRead(TRIGGER_PIN) == LOW)
      {
    
        // reset settings - for testing
        wm.resetSettings();
    
        delay(3000);
        // reset and try again, or maybe put it to deep sleep
        ESP.restart();
        delay(5000);
      }
    
      SinricPro.handle();
    }
    