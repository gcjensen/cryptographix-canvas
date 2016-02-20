# comp3200
Web-Based Visual Modelling for Secure Systems and Networks.

Author: George Jensen

## Running The App

To run the app, follow these steps.

1. Ensure NodeJS is installed.
2. Ensure [MongoDB](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#install-mongodb-manually) is installed and configured. 
3. Navigate to the server directory and execute

  ```shell
  npm install
  ```
4. To start the server, execute:
 
  ```shell
  node server.js
  ```
5. Navigate to the client directory and execute:

  ```shell
  npm install
  ```
6. Install Gulp globally:

  ```shell
  npm install -g gulp
  ```

7. Install jspm globally:

  ```shell
  npm install -g jspm
  ```
  
8. Install the client-side dependencies with jspm:

  ```shell
  jspm install -y
  ```

9. To run the app, execute:

  ```shell
  gulp watch
  ```
10. Browse to [http://localhost:9000](http://localhost:9000). 
