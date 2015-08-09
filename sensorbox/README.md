aml-sensorbox-firmware
======================

Arduino-Based Firmware for esp8266
This Firmware drives the Sensorboxes used for *All my Lives*

**Project:** All my Lives < http://www.all-my-lives.ch >
**Author:** Cyrill von Wattenwyl < eni@e23.ch >

## Building ##

This firmware requires arduino-esp8266 ( https://github.com/esp8266/Arduino ) and a linux system to build.

* ajust path of Arduino installation in `Makefile` with var `ARDUINO_DIR`
* optional: clean build directory:
```
make clean
```
* Build firmware:
```
make
```
* upload firmware ( your linux-user needs to have access to ttyUSB ):
```
make upload
```
* Open serial console:
```
make monitor
```




## Serial ##

### Port Settings

* Baudrate: `115200`
* Line endings: `CR` `\r`
* Parity: `none`
* Stop bits: `none`

### Commands

#### `ping`
**Description:** Simple ping function
**Response:**  `pong`

#### `info`
**Description:** Get System infos
**Response (Example):**
```
wifi.status = connected
wifi.mac = AA:BB:CC:11:22:33
wifi.ip = 10.10.100.10
wifi.netmask = 255.255.0.0
wifi.gateway = 10.10.1.1
eeprom.wifi_ssid = yourmomswifi
eeprom.wifi_pass = yourmomspassword
eeprom.trigger_host = 10.10.10.20
eeprom.trigger_port = 8080
eeprom.trigger_uri = /foo/bar/baz
firmware.version = 042ff48
firmware.configversion = 001
esp8266.free_heap = 31408
esp8266.chip_id = 10767517
esp8266.flash_size = 4194304
esp8266.flash_speed = 40000000
esp8266.cycle_count = 260624641
```


#### `update-wifi SSID PASSWORD`
**Description:** Update Wifi-Configruartion.
  *Param SSID*: Network SSID, maxlen: 64
  *Param PASSWORD*: Network password, maxlen: 64
**Example:** `update-wifi newwifi passw0rd`
**Response:** `ok`


#### `update-trigger HOST:PORT:URI`
**Description:** Update Trigger-URL-Configruartion.
  *Param HOST*: Hostname or IP, maxlen: 64
  *Param PORT*: Port to connect
  *Param URI*: Uri to post request, maxlen: 64
**Example:** `update-trigger example.com:8080/foo/bar/baz`
**Response:** `ok`


#### `reconnect-wifi`
**Description:** Reconnect current wifi-connection. 10 secounds in background, after that time connection goes to background
**Response: (success)**
```
....................
ok
```
**Response: (error)**
```
.................................................................................
fail
```

#### `show-debug`
**Description:** Show debug messages
**Response:** `ok`


#### `hide-debug`
**Description:** Hide debug messages
**Response:** `ok`
