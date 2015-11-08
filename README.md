## fh-zabbix
A node module for configuring a Zabbix server. The intended usage is to provide a Docker image that will use this fh-zabbix module to configure a Zabbix Server in OpenShift.

This module uses the [Zabbix Web API](https://www.zabbix.com/documentation/2.4/manual/api).

### Install
```shell
npm install
```

### Usage
Currently, we don't support all possible [API](https://www.zabbix.com/documentation/2.4/manual/api) calls but only those that we currently have use of. The following calls are supported:

* createHostGroup
* createHost
* createWebScenarios

```javascript
var fh_zabbix = require('fh-zabbix').forServer('http://localhost');
fh_zabbix.authenticate(username, password, function(err, zabbix) {
    zabbix.createHostGroup(groupName, function(err, groupId) {
      ...
    });
});
```
The above can get unreadably very quickly so we recommend using something like ```async-waterfall```, which is what is used in [run.sh](./run.sh).


### Testing

#### Running all tests
```shell
$ grunt mochaTest
```

#### Running a single test function
This requires that [mocha](https://mochajs.org/) is installed globally:

```shell
$ npm install mocha -g
```

Execute a single test function:  

```shell
$ mocha test/test-create-ping-check.js -g extractAuthToken
```

#### Manually testing ```run.sh```
```shell
$ FH_ZABBIX_SERVER="http://192.168.99.100/" FH_ZABBIX_USER="admin" FH_ZABBIX_PASSWORD="zabbix" ./run.sh ./config/config.json
```
Or you can run it using ```npm start```:

```shell
$ FH_ZABBIX_SERVER="http://localhost" FH_ZABBIX_USER="admin" FH_ZABBIX_PASSWORD="zabbix" npm start
```

### Building the Docker image
```shell
$ docker build -t fh-zabbix .
```
### Running the Docker image
```shell
$ docker run -e "FH_ZABBIX_SERVER=http://localhost" -e "FH_ZABBIX_USER=admin" -e "FH_ZABBIX_PASSWORD=zabbix" -it --rm --name fh-zabbix-run fh-zabbix
```
### Setting up Zabbix locally
To simplify testing a local Zabbix installation can set up using Docker.

First, start the MariaDB container:   
 
```shell
$ docker run -d --name zabbix-db -p 3306:3306 --env="MARIADB_USER=zabbix" --env="MARIADB_PASS=my_password" zabbix/zabbix-db-mariadb
```
Next, start the Zabbix container:  

```shell
$ docker run -d --name zabbix-server -p 80:80  -p 10051:10051 --link zabbix-db:zabbix.db --env="ZS_DBHost=zabbix.db" --env="ZS_DBUser=zabbix" --env="ZS_DBPassword=my_password" zabbix/zabbix-server-2.4
```
You should now be able to access the Zabbix console using ```http://docker-host-ip```.  
You can log in using username 'Admin' and password 'zabbix'.

##### Finding the ip address of you docker machine
To find ip adress using docker-machine:

```shell
$ docker-machine env name
```

To find the ip address using boot2docker:

```shell
$ $ boot2docker ip
``` 



