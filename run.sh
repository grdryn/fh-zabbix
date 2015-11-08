#!/usr/bin/env node

var serverUrl = required('FH_ZABBIX_SERVER', process.env.FH_ZABBIX_SERVER);
var username = required('FH_ZABBIX_USER', process.env.FH_ZABBIX_USER);
var password = required('FH_ZABBIX_PASSWORD', process.env.FH_ZABBIX_PASSWORD);
var config = require(process.argv[process.argv.length-1]);

var waterfall = require('async-waterfall');
var fh_zabbix = require('./lib/fh-zabbix.js').forServer(serverUrl);
fh_zabbix.authenticate(username, password, function(err, zabbix) {
  if (err) {
    console.error("Error: ", err);
    return 4;
  } 
  console.log('Authentication successful');

  waterfall([
    function (callback) {
      console.log('Creating Zabbix Host Group', config.zabbix.hostGroup);
      zabbix.createHostGroup(config.zabbix.hostGroup, callback);
    },
    function (groupId, callback) {
      var host = config.zabbix.host;
      host.groups = [{ 'groupid': groupId}];
      console.log('Creating Zabbix Host: ', host);
      zabbix.createHost(host, callback);
    },
    function (hostId, callback) {
      var checks = config.zabbix.webscenarios;
      checks.hostid = hostId;
      console.log('Creating Zabbix WebScenario: ', checks);
      zabbix.createWebScenarios(checks, callback);
    }
  ], function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log('Successfully create Web Scenario with id: ' + result);
  }
  });
});

function required(name, value) {
  if (!value) {
    console.error('Environment variable', name, ' was not configured');
    process.exit(1);
  }
  return value;
}
