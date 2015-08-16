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
