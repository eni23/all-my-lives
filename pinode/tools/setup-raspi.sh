#!/bin/bash
#
# This Scripts Setups a Raspi as aml-pinode
#

AML_LOCATION="/opt/all-my-lives"

# update system and install deps
apt-get update
apt-get upgrade -y
apt-get install vim mplayer daemontools daemontools-run -y

# nodejs & npm
sudo dpkg -i $AML_LOCATION/pinode/tools/node_latest_armhf.deb
curl -L https://npmjs.com/install.sh | sh

# install socket.io globally, since it takes long time to rebuild on every deploy
# npm install -g socket.io
tar xfvz $AML_LOCATION/pinode/tools/socket.io-armhf.tar.gz

# install aml
cd $AML_LOCATION/pinode
npm install

# install service
mkdir /etc/service/aml-pinode
cp $AML_LOCATION/pinode/bin/run /etc/service/aml-pinode/run
chmod a+x /etc/service/aml-pinode/run
chmod -R 755 /etc/service/aml-pinode

# better bashrc
wget -O /etc/profile.d/adsy-bashrc.sh http://data.e23.ch/bashrc/adsy-bashrc.sh

echo "all done"
