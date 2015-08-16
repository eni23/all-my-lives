#!/bin/bash
#
# This Scripts Setups a Raspi as aml-pinode
#

AML_LOCATION="/opt/all-my-lives"

# update system and install deps
apt-get update
apt-get upgrade -y
apt-get install vim mplayer daemontools daemontools-run git -y

# nodejs & npm
wget -O /tmp/nodejs.deb http://data.e23.ch/node_latest_armhf.deb
sudo dpkg -i /tmp/nodejs.deb
apt-get install nodejs
curl -L https://npmjs.com/install.sh | sh

# install precompiled socket.io
wget -O /tmp/socketio.tgz http://data.e23.ch/socket.io-armhf.tar.gz
tar xfvz /tmp/socketio.tgz

# install aml
cd $AML_LOCATION/pinode
npm install

# install service
mkdir /etc/service/aml-pinode
cp $AML_LOCATION/pinode/bin/run /etc/service/aml-pinode/run
chmod a+x /etc/service/aml-pinode/run
chmod -R 755 /etc/service/aml-pinode

mkdir /opt/media
chmod 755 /opt/media
cp $AML_LOCATION/pinode/test-media/* /opt/media/

# better bashrc
wget -O /etc/profile.d/adsy-bashrc.sh http://data.e23.ch/bashrc/adsy-bashrc.sh

echo "all done"
