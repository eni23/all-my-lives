# pinode

This Document describes how to Deploy a pinode

## Install steps


#### Flash SD-Card
```
dd bs=4M if=2015-05-05-raspbian-wheezy.img of=/dev/sdd
sync
```
Display copy Status with ```pkill -USR1 -n -x dd```

#### Setup Network

##### non-wifi:
*/etc/network/interfaces*
```
auto lo
iface lo inet loopback

auto eth0
allow-hotplug eth0
iface eth0 inet static
  address 10.10.1.70
  netmask 255.255.255.0
  gateway 10.10.1.1
  dns-nameservers 8.8.8.8

auto wlan1
allow-hotplug wlan1
iface wlan0 inet manual

auto wlan0
allow-hotplug wlan0
iface wlan1 inet manual
```

##### wifi:
```
scp setup-wifi.sh root@10.10.1.70:
ssh root@10.10.1.70
./setup-wifi 70
```

#### Set Root Password
Set Root Password with:```passwd ```
and copy your SSH-Key to ```/root/.ssh/authorized_keys```

#### Clone Repo and run Installer
```
cd /opt
git clone https://github.com/eni23/all-my-lives/
chmod a+x /opt/all-my-lives/pinode/tools/setup-raspi.sh
/opt/all-my-lives/pinode/tools/setup-raspi.sh
```

#### Optional: Bluetooth

Install extra Packages:
```
apt-get install --no-install-recommends bluez-utils bluez-alsa python-gobject
```

add the following to ```[General]``` section of ```/etc/bluetooth/audio.conf```
```
Enable=Source,Sink,Media,Socket
```
Restart bluez with ```service bluetooth restart```

Create ```/root/.asoundrc``` with the following content:
```
pcm.bluetooth {
        type bluetooth
        device "C8:84:47:01:CB:9F"
        profile "auto"
}
```

Scan for pairable devices:
```
hcitool scan
```

Pair with your Device (only 1 time):
```
bluez-simple-agent -c NoInputNoOutput hci0 C8:84:47:01:CB:9F
```

Test if connection works:
```
bluez-test-audio connect C8:84:47:01:CB:9F
mplayer -ao alsa:device=bluetooth /opt/media/never_gonna_give_you_up.mp3
```

Create Script for Connectiong at Boot and every 1 Hour at location: ```/opt/bt-connect.sh``` with the following content:
```
#!/bin/bash
bluez-test-audio connect C8:84:47:01:CB:9F
```
Then make it executable:
```
chmod a+x /opt/bt-connect.sh
```

Create Cronjob with ```crotab -e``` put at the end:
```
@reboot /opt/bt-connect.sh > /dev/null
@hourly /opt/bt-connect.sh > /dev/null
```

#### Optional: Black Screen after Boot (Videonodes)
Install extra Packages:
```
apt-get install fbi
wget -O /opt/black.jpg http://data.e23.ch/black.jpg
```
Disable "Rainbow Square"
```
echo "avoid_warnings=1" >> /boot/config.txt
```

Create Script for blacking at boot: ```/opt/blackscreen.sh``` with the following content:
```
#!/bin/bash
fbi -T 1 -d /dev/fb0 -a -noverbose /opt/black.jpg
```
Make it executable:
```
chmod a+x /opt/blackscreen.sh
```

Create Cronjob with ```crotab -e``` put at the end:
```
@reboot /opt/blackscreen.sh > /dev/null
```


#### olad (aml-manager)

Add the following Repo to ```/etc/apt/sources.list```
```
deb   http://apt.openlighting.org/raspbian  wheezy main
```
Then install ola:
```
apt-get update
apt-get install ola
```
