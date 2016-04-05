#!/bin/bash

npm set registry https://registry.npmjs.org/
cd server
sudo npm install
cd ../client
sudo npm install
sudo npm install -g gulp
sudo npm install -g jspm
sudo jspm install -y
cd ..
chmod u+x start.sh
chmod u+x stop.sh
./start.sh