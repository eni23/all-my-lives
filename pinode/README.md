# pinode

Hardware and Software for "All my Lives" ( http://www.all-my-lives.ch )

## install steps

```
dd bs=4M if=2015-05-05-raspbian-wheezy.img of=/dev/sdd
pkill -USR1 -n -x dd

# boot raspi with an monitor connected, setup network

# ola (aml-manager only)
vim /etc/apt/sources.list
deb   http://apt.openlighting.org/raspbian  wheezy main
apt-get install ola


deb http://mirror.switch.ch/ftp/mirror/raspbian/raspbian/ wheezy main contrib non-free rpi

git clone https://github.com/eni23/all-my-lives/
chmod a+x /opt/all-my-lives/pinode/tools/setup-raspi.sh
 /opt/all-my-lives/pinode/tools/setup-raspi.sh

```


== bluetooth audio ==

apt-get install bluez-utils bluez-alsa
hcitool scan

vim /root/.asoundrc
pcm.bluetooth {
        type bluetooth
        device "C8:84:47:01:CB:9F"
        profile "auto"
}

vim /etc/bluetooth/audio.conf
Enable=Source,Sink,Media,Socket

# Pairing
bluez-simple-agent -c NoInputNoOutput hci0 C8:84:47:01:CB:9F


# connecting (at every boot)
bluez-test-audio connect C8:84:47:01:CB:9F

vim /opt/bt-connect.sh
---
#!/bin/bash
bluez-test-audio connect C8:84:47:01:CB:9F
---
chmod a+x /opt/bt-connect.sh

crontab -e
---
@reboot /opt/bt-connect.sh > /dev/null
@hourly /opt/bt-connect.sh > /dev/null
---

# black screen after boot for videonodes
apt-get install fbi
wget -O /opt/black.jpg http://data.e23.ch/black.jpg

vim /opt/blackscreen.sh
---
#!/bin/bash
fbi -T 1 -d /dev/fb0 -a -noverbose /opt/black.jpg
---

chmod a+x /opt/blackscreen.sh
crontab -e
@reboot /opt/blackscreen.sh > /dev/null

echo "avoid_warnings=1" >> /boot/config.txt
