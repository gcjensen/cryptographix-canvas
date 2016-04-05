#!/bin/bash

echo "For debugging purposes run the programs seperately, as per the README, for full output. This script is provided for convenience."
nohup mongod &
echo "Local mongoDB instance started..."
cd server
nohup nodemon server.js &
echo "Server started..."
cd ../client
nohup gulp watch &
echo "Client server starting... allow up to 10 seconds for it to fully start."
cd ..