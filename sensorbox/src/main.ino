/*******************************************************************************
 *
 * Sensorbox-Firmware (aml-sensorbox)
 *
 * Project: All My Lives < www.all-my-lives.ch >
 * Author: Cyrill vW. < eni@e23.ch >
 *
 * This file needs to be compiled with Arduino-esp8266,
 * Website: https://github.com/esp8266/Arduino
 *
 ******************************************************************************/

#include <string.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include "aml-sensorbox-version.h"

// gpio port of for person detection sensor (pir)
#define GPIO_PIR 2
// gpio port for door sensor (reed)
#define GPIO_REED 14
// delay in main loop ticks for events
#define TRIGGER_DELAY 2500
// serial port baudrate
#define SERIAL_BAUD 115200
// maximal serial input line length
#define SERIAL_INPUT_BUFFER_SIZE 256
// configuration version (required to locate correct location in eeprom)
#define CONFIG_VERSION "001"
// start address for config-struct in eeprom
#define CONFIG_START 32

// shortcuts for door / person status
#define DOOR_STATUS_CLOSED 0
#define DOOR_STATUS_OPEN 1
#define PIR_STATUS_NONE 0
#define PIR_STATUS_MOVING 1

// settings struct stored in eeprom, default values only set if no config found
struct eeprom_config_struct {
  char version[4];
  char wifi_ssid[64];
  char wifi_pass[64];
  char trigger_host[64];
  long  trigger_port;
  char trigger_uri[64];
} eeprom_config = {
  CONFIG_VERSION,
  "yourmomswifi",
  "isfat",
  "10.10.10.10",
  80,
  "/trigger"
};



// if true, debug("foo") prints line on serial port
bool show_debug_messages = true;


/**
 * connect to wifi. if reconnect is true, connection is closed first
 **/
void wifi_connect( bool reconnect = false ) {
  if ( reconnect ) {
    debug( "auto: stop wifi" );
    WiFi.disconnect();
    delay( 100 );
  }
  debug( "auto: connecting to wifi" );
  WiFi.begin( eeprom_config.wifi_ssid, eeprom_config.wifi_pass );
}

/**
 * sensors
 **/

uint8_t gpio_reed;
uint8_t gpio_pir;

void read_gpio() {
  gpio_reed = digitalRead( GPIO_REED );
  gpio_pir = digitalRead( GPIO_PIR );
}

/**
 * arduino-init function
 **/
void setup() {
  pinMode( GPIO_REED, INPUT );
  //pinMode( GPIO_PIR, INPUT_PULLDOWN );
  pinMode(GPIO_PIR, INPUT_PULLDOWN);

  Serial.begin( SERIAL_BAUD );
  EEPROM.begin( sizeof( eeprom_config ) + CONFIG_START );
  debug( "eeprom start" );
  delay( 50 );
  // load settings from eeprom to struct eeprom_config
  eeprom_load_config();
  // connect to wifi
  wifi_connect();
  delay(1000);
}


/**
 * arduino-main entry point after setup()
 **/
uint32_t loop_ticks = 0;
uint32_t last_wifi_connection_try = 0;
uint32_t last_gpio_pir_tick = 0;
uint32_t last_gpio_reed_tick = 0;
uint8_t door_status = 0;
uint8_t pir_status = 0;

void loop() {
  // do serial stuff first
  if ( Serial.available() ) {
    serial_server_event();
  }
  // if wifi isn't connected, reconnect. non-blocking, re-try every 20sec
  if ( ( (loop_ticks + 1) ) > 4294967290 ) {
    loop_ticks = last_wifi_connection_try = last_gpio_pir_tick = last_gpio_reed_tick = 0;
  }
  if (  WiFi.status() != WL_CONNECTED ) {
    if ( loop_ticks > ( last_wifi_connection_try + 20000 ) ) {
      last_wifi_connection_try = loop_ticks;
      wifi_connect();
    }
  }
  read_gpio();

  // door sensor
  if ( gpio_reed == HIGH ) {

    if ( door_status == DOOR_STATUS_CLOSED ) {
      //delay(1000);
      debug( "door open" );
      delay(10);
      triggerurl();
      door_status = DOOR_STATUS_OPEN;
    }
  }
  else {
    if ( door_status == DOOR_STATUS_OPEN ) {
      //delay(1000);
      debug( "door closed" );
      delay(10);
      triggerurl();
      door_status = DOOR_STATUS_CLOSED;
    }
  }

  // person sensor
  if ( gpio_pir == HIGH ) {
    //if ( loop_ticks > ( last_gpio_pir_tick + TRIGGER_DELAY ) ) {
    //  last_gpio_pir_tick = loop_ticks;
    //  debug( "trigger pir" );
    //  triggerurl();
    //}
    if ( pir_status == PIR_STATUS_NONE ) {
      debug( "pir moving" );
      delay(10);
      triggerurl();
      pir_status = PIR_STATUS_MOVING;
    }
  }
  else {
    if ( pir_status == PIR_STATUS_MOVING ) {
      debug( "pir moving end" );
      delay(10);
      triggerurl();
      pir_status = PIR_STATUS_NONE;
    }
  }

  loop_ticks++;
  delay(1);
}

/**
 * serial debug message
 **/
void debug( const char* message ) {
  if ( show_debug_messages ) {
   Serial.println( message );
  }
}


/**
 * triggered from sensors
 **/
WiFiClient client;

uint32_t last_triggerurl_tick = 0;
void triggerurl() {
  if ( loop_ticks < ( last_triggerurl_tick + TRIGGER_DELAY ) ) {
    return;
  }

  client.stop();

  last_triggerurl_tick = loop_ticks;
  debug("trigger");
  read_gpio();

  if (  WiFi.status() != WL_CONNECTED ) {
    debug("error: wifi not connected");
    return;
  }


  // try to connect to the server
  debug("commect to server");
  if ( ! client.connect( eeprom_config.trigger_host, eeprom_config.trigger_port ) ) {
    debug("connection to trigger url failed");
    return;
  }

  // if successfull: send request to the server
  client.print( String( "GET " ) +
                eeprom_config.trigger_uri +
                "/" +
                gpio_reed +
                "/" +
                gpio_pir +
                " HTTP/1.1\r\n" +
                "Host: " +
                eeprom_config.trigger_host +
                "\r\n" +
                "Connection: close\r\n\r\n" );

  debug( "flushing & closing connection" );
  client.flush();
  client.stop();
}


/**
 * split a string and get chuck at desired position
 * example:
 * data="foo,bar,baz" separator="," index=2  => baz
 * data="foo/bar" separator="/" index=0  => foo
 **/
String get_str_token( String data, char separator, int index ) {
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length()-1;
  for( int i = 0; i <= maxIndex && found <= index; i++ ){
    if( data.charAt( i ) == separator || i == maxIndex ){
        found++;
        strIndex[0] = strIndex[1] + 1;
        strIndex[1] = ( i == maxIndex ) ? i + 1 : i;
    }
  }
  return found > index ? data.substring( strIndex[0], strIndex[1] ) : "";
}



/*******
 * EEPROM helpers
 * Simple load/save stuct-config into eeprom
 *******/

/**
 * load eeprom-struct if version check passes
 **/
void eeprom_load_config() {
  debug( "eeprom: load" );
  // If nothing is found we load default settings.
  if ( EEPROM.read( CONFIG_START + 0 ) == CONFIG_VERSION[0] &&
       EEPROM.read( CONFIG_START + 1 ) == CONFIG_VERSION[1] &&
       EEPROM.read( CONFIG_START + 2 ) == CONFIG_VERSION[2] ) {
    for ( unsigned int t = 0; t < sizeof( eeprom_config ); t++ ) {
      *( ( char* ) &eeprom_config + t ) = EEPROM.read( CONFIG_START + t );
    }
  }
}

/**
 * save eeprom-struct
 **/
void eeprom_save_config() {
  debug( "eeprom: save" );
  for ( unsigned int t = 0; t < sizeof( eeprom_config ); t++ ) {
    EEPROM.write( CONFIG_START + t, *( ( char* ) &eeprom_config + t ) );
  }
  EEPROM.commit();
}



/*******
 * Serial functions
 * Provide a simple serial terminal for getting and setting wifi and
 * trigger configuration.
 *******/

// buffer used for storing incoming serial data
char serial_rcv_data[SERIAL_INPUT_BUFFER_SIZE];
// char-counter for serial input
uint8_t serial_rcv_data_pos = 0;


/**
 * gets called for every char recived by serial port
 * the char is stored in buffer serial_rcv_data[256]
 **/
void serial_server_event() {
  char current_char = Serial.read();

  // backspace: delete last char in buffer
  if ( current_char == 0x7F && serial_rcv_data_pos > 0 ) {
    serial_rcv_data[serial_rcv_data_pos-1];
    serial_rcv_data_pos--;
    Serial.print("\b");
    Serial.print(" ");
    Serial.print("\b");
    return;
  }


  // carriage return recived = new line
  if (current_char == '\r') {
    Serial.println( current_char );
    serial_rcv_data[serial_rcv_data_pos] = '\0';
    serial_server_parseline();
    return;
  }
  // put every other char than cr into buffer
  Serial.print( current_char );
  serial_rcv_data[serial_rcv_data_pos] = current_char;
  serial_rcv_data_pos++;
}


/**
 * this function parses every line recived by serial port and exectues an action
 * if command found.
 * to keep it simple, everything is done by this single function and input is
 * processed as strings, not char-arrays..
 **/
void serial_server_parseline() {

  // split incoming line by whitespace and parse first chuck as possible command
  String serdata( serial_rcv_data );
  String command = "";
  command = get_str_token( serdata, ' ', 0 );

  // empty buffer and zero counter
  memset(serial_rcv_data, 0, sizeof( serial_rcv_data ) );
  serial_rcv_data_pos = 0;

  // simple pong for recognition
  if (  command ==  "ping" ) {
    Serial.println( "pong" );
    return;
  }

  // update wifi settings
  if ( command == "update-wifi" ) {

    String wifi_ssid = "";
    wifi_ssid = get_str_token( serdata, ' ', 1 );
    String wifi_pass = "";
    wifi_pass = get_str_token( serdata, ' ', 2 );

    if ( show_debug_messages ) {
      Serial.println( "updating wifi-configuration in eeprom" );
      Serial.print( "new wifi_ssid: " );
      Serial.println( wifi_ssid );
      Serial.print( "new wifi_pass: " );
      Serial.println( wifi_pass );
    }

    wifi_ssid.toCharArray( eeprom_config.wifi_ssid, 64 );
    wifi_pass.toCharArray( eeprom_config.wifi_pass, 64 );
    eeprom_save_config();

    Serial.println("ok");
    return;
  }

  // update trigger url settings
  if ( command == "update-trigger" ) {
    String raw_data = "";
    raw_data = get_str_token( serdata, ' ', 1 );
    String trigger_host = "";
    trigger_host = get_str_token( raw_data, ':', 0 );
    String trigger_port = "";
    trigger_port = get_str_token( raw_data, ':', 1 );
    String trigger_uri = "";
    trigger_uri = get_str_token( raw_data, ':', 2 );

    if ( show_debug_messages ) {
      Serial.println( "updating trigger url-configuration in eeprom" );
      Serial.print( "new trigger_host: " );
      Serial.println( trigger_host );
      Serial.print( "new trigger_port: " );
      Serial.println( trigger_port );
      Serial.print( "new trigger_uri: " );
      Serial.println( trigger_uri );
    }

    trigger_host.toCharArray( eeprom_config.trigger_host, 64 );
    trigger_uri.toCharArray( eeprom_config.trigger_uri, 64 );
    eeprom_config.trigger_port = trigger_port.toInt();
    eeprom_save_config();

    Serial.println( "ok" );
    return;
  }

  // trigger url
  if ( command == "test-trigger" ) {
    triggerurl();
    Serial.println( "ok" );
    return;
  }

  // reconnect wifi
  if ( command == "reconnect-wifi" ) {
    serial_wifi_reconnect();
    return;
  }

  // turn on printing debug messages
  if ( command == "show-debug" ) {
    show_debug_messages = true;
    Serial.println("ok");
    return;
  }

  // turn off printing debug messages
  if ( command == "hide-debug" ) {
    show_debug_messages = false;
    Serial.println("ok");
    return;
  }

  // print detailed systeminfos
  if ( command == "info" ) {

    eeprom_load_config();
    delay(10);

    // wifi status
    String wifi_status_human="";
    switch ( WiFi.status() ) {
      case WL_NO_SHIELD:
        wifi_status_human="no shield";
        break;
      case WL_IDLE_STATUS:
        wifi_status_human="idle";
        break;
      case WL_NO_SSID_AVAIL:
        wifi_status_human="requested ssid not aviable";
        break;
      case WL_SCAN_COMPLETED:
        wifi_status_human="ssid scan completed";
        break;
      case WL_CONNECTED:
        wifi_status_human="connected";
        break;
      case WL_CONNECT_FAILED:
        wifi_status_human="connection failed";
        break;
      case WL_CONNECTION_LOST:
        wifi_status_human="connection lost";
        break;
      case WL_DISCONNECTED:
        wifi_status_human="disconnected";
        break;
    }

    // wifi info
    Serial.print( "wifi.status = " );
    Serial.println( wifi_status_human );
    Serial.print( "wifi.mac = " );
    byte mac[6];
    WiFi.macAddress(mac);
    Serial.print(mac[5],HEX);
    Serial.print(":");
    Serial.print(mac[4],HEX);
    Serial.print(":");
    Serial.print(mac[3],HEX);
    Serial.print(":");
    Serial.print(mac[2],HEX);
    Serial.print(":");
    Serial.print(mac[1],HEX);
    Serial.print(":");
    Serial.println(mac[0],HEX);
    if ( WiFi.status() == WL_CONNECTED ) {
      Serial.print( "wifi.ip = " );
      Serial.println( WiFi.localIP() );
      Serial.print( "wifi.netmask = " );
      Serial.println( WiFi.subnetMask() );
      Serial.print( "wifi.gateway = " );
      Serial.println( WiFi.gatewayIP() );
    }

    // eeprom-dump
    Serial.print( "eeprom.wifi_ssid = " );
    Serial.println( eeprom_config.wifi_ssid );
    Serial.print( "eeprom.wifi_pass = " );
    Serial.println( eeprom_config.wifi_pass );
    Serial.print( "eeprom.trigger_host = " );
    Serial.println( eeprom_config.trigger_host );
    Serial.print( "eeprom.trigger_port = " );
    Serial.println( eeprom_config.trigger_port );
    Serial.print( "eeprom.trigger_uri = " );
    Serial.println( eeprom_config.trigger_uri );

    // version & esp-internals
    Serial.println(  "firmware.version = " AML_SENSORBOX_GIT_TAGID );
    Serial.println( "firmware.configversion = "  CONFIG_VERSION);

    Serial.print( "esp8266.free_heap = " );
    Serial.println( ESP.getFreeHeap() );
    Serial.print( "esp8266.chip_id = " );
    Serial.println( ESP.getChipId() );
    Serial.print( "esp8266.flash_size = " );
    Serial.println( ESP.getFlashChipSize() );
    Serial.print( "esp8266.flash_speed = " );
    Serial.println( ESP.getFlashChipSpeed() );
    Serial.print( "esp8266.cycle_count = " );
    Serial.println( ESP.getCycleCount() );


    return;
  }

  // if nothing matches, command not found
  debug("unknown command");
}



/**
 * reconnect wifi from serial command. this func is blocking cpu
 * for rounds*round_delay ms
 **/
void serial_wifi_reconnect( ) {
  debug("do a wifi-reconnect");
  debug( "disconnecting from current network (100ms)" );
  WiFi.disconnect();
  delay( 100 );
  debug( "connecting (10sec)" );
  WiFi.begin( eeprom_config.wifi_ssid, eeprom_config.wifi_pass );
  int rounds = 0;
  while ( WiFi.status() != WL_CONNECTED ) {
    delay( 50 );
    Serial.print( "." );
    rounds++;
    // delay=50ms, rounds=200, time=10sec
    if (rounds > 200 ){
      if (  WiFi.status() != WL_CONNECTED ) {
        Serial.println( "." );
        Serial.println( "fail" );
        debug( "failed to connect in given timeframe. connection open in background" );
        return;
      }
      break;
    }
    rounds++;
  }
  Serial.println( "." );
  if (  WiFi.status() == WL_CONNECTED ) {
    Serial.println( "ok" );
  }
}
