#!/bin/bash

echo "Stopping the client..."
pkill gulp
echo "Stopping the server..."
pkill node
echo "Stopping the local MongoDB instance..."
pkill mongod
echo "All instances of gulp, node and mongod have been stopped."
rm nohup.out
rm client/nohup.out
rm server/nohup.out
