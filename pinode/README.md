# pinode

Hardware and Software for "All my Lives" ( http://www.all-my-lives.ch )

## install steps

```
dd bs=4M if=2015-05-05-raspbian-wheezy.img of=/dev/sdd
pkill -USR1 -n -x dd

# setup network

apt-get install libmicrohttpd10 libprotobuf7 vim

vim /etc/apt/sources.list
deb   http://apt.openlighting.org/raspbian  wheezy main

wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb


```
