# CryptoGraphix Canvas
Web-Based Visual Modelling for Secure Systems and Networks.

Author: George Jensen

## Running The App

To run the app, follow these steps.

1. Ensure NodeJS is installed.
2. Ensure [MongoDB](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#install-mongodb-manually) is installed and configured. 
4. Make the build script executable

  ```shell
  chmod u+x build.sh
  ```

3. Run the build script

  ```shell
  ./build.sh
  ```

  This will install the required packages and start the application. 

4. Browse to [http://localhost:9000](http://localhost:9000). 

In future, the application can be started and stopped by running the respective scripts.

  ```shell
  ./start.sh
  ```

  ```shell
  ./stop.sh
  ```

Alternatively, packages can be installed manually, and then processes started seperately (for debugging purposes), by following the steps below.

1. In a terminal start MongoDB by executing

  ```shell
  mongod
  ```

2. Navigate to the server directory and execute

  ```shell
  npm install
  ```

3. To start the server, execute:
 
  ```shell
  nodemon server.js
  ```

4. Navigate to the client directory and execute:

  ```shell
  npm install
  ```

5. Install Gulp globally:

  ```shell
  npm install -g gulp
  ```

6. Install jspm globally:

  ```shell
  npm install -g jspm
  ```
  
7. Install the client-side dependencies with jspm:

  ```shell
  jspm install -y
  ```

8. To run the app, execute:

  ```shell
  gulp watch
  ```
  
9. Browse to [http://localhost:9000](http://localhost:9000). 
