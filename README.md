# all-my-lives

Hardware and Software for "All my Lives" ( http://www.all-my-lives.ch )

## sensorbox

ESP8266-based sensor device with pir and reed-sensor. if a sensor triggers, it sends a request (over wifi) to a configurable url. hardware and software.


## pinode

node.js-based app, plays a predefined "sketch" when a url is triggered by sensorbox.
supports video, audio, lifx, dmx and shell-scripts in "sketches". runs on a raspi2.

Screenshot:
![alt tag](https://i.imgur.com/dNtGw23.png)

## aml-manager

ola-based artnet=>dmx node, monitoring and shortcuts to pinode-webui's. runs on a raspi1.