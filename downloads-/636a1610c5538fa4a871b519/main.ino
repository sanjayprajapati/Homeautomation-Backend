
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
    #define APP_KEY "d5a14340-383c-49c0-b022-6470a465c390" // Should look like "de0bxxxx-1x3x-4x3x-ax2x-5dabxxxxxxxx"
    #define APP_SECRET "69f2cbd6-2cdf-44bf-b798-ec63d805a50d-f2665a52-58b8-4ee3-991d-0468e449874c" // Should look like "5f36xxxx-x3x7-4x3x-xexe-e86724a9xxxx-4c4axxxx-3x3x-x5xe-x9x3-333d65xxxxxx"

    #define SWITCH_ID_1 "636a1610c5538fa4a871b51b" // Should look like "5dc1564130xxxxxxxxxxxxxx"
    #ifdef ESP8266
    #define TRIGGER_PIN D0
    #define SWITCHPIN_1 D1
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
      //  add devices and callbacks to SinricPro
      SinricProSwitch &mySwitch1 = SinricPro[SWITCH_ID_1];
      mySwitch1.onPowerState(onPowerState1);
    
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
    