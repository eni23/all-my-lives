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
apt-get install vim mplayer daemontools daemontools-run

# nodejs & npm (all nodes)
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb
apt-get install nodejs
curl -L https://npmjs.com/install.sh | sh




```
