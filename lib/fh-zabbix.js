/*
 JBoss, Home of Professional Open Source
 Copyright Red Hat, Inc., and individual contributors.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
var request = require('request');
var serverUrl;
var version = '2.0';

var defaultOptions = {
  headers: {
    'Content-Type': 'application/json-rpc'
  }
};

module.exports.forServer = function(url) {
  serverUrl = checkParam('url', url);
  defaultOptions.url = serverUrl + '/api_jsonrpc.php';
  return {
    'authenticate': authenticate,
    'getAuthToken': getAuthToken,
    'createHostGroup': createHostGroup,
    'createHost': createHost,
    'createWebScenarios': createWebScenarios
  };
};

function authenticate(username, password, callback) {
  getAuthToken(username, password, function(err, authToken) {
    if (err) {
      callback(err);
    } else {
      var closures = {
        'createHostGroup': _createHostGroup(authToken),
        'createHost': _createHost(authToken),
        'createWebScenarios': _createWebScenarios(authToken)
      };
      callback(null, closures);
    }
  });
}

function getAuthToken(username, password, callback) {
  var params = {'user': checkParam('username', username), 'password': checkParam('password', password)};
  var json = jsonrpc(version, 'user.login', 1, params);
  var passThrough = function(result) { return result; };
  post(defaultOptions.headers, defaultOptions.url, json, passThrough, callback);
}

function _createHostGroup(authToken) {
  return function(groupName, callback) {
    createHostGroup(authToken, groupName, callback);
  };
}

function createHostGroup(authToken, groupName, callback) {
  var params = {'name': checkParam('groupName', groupName)};
  var json = jsonrpc(version, 'hostgroup.create', 2, params, checkParam('authToken', authToken));
  var getGroupId = function(result) { return result.groupids[0]; };
  post(defaultOptions.headers, defaultOptions.url, json, getGroupId, callback);
}

function _createHost(authToken) {
  return function(params, callback) {
    createHost(authToken, params, callback);
  };
}

function createHost(authToken, params, callback) {
  checkParam('callback', callback);
  var json = jsonrpc(version, 'host.create', 4, checkParam('params', params), checkParam('authToken', authToken));
  var getHostId = function(result) { return result.hostids[0]; };
  post(defaultOptions.headers, defaultOptions.url, json, getHostId, callback);
}

function _createWebScenarios(authToken) {
  return function(checks, callback) {
    createWebScenarios(authToken, checks, callback);
  };
}

function createWebScenarios(authToken, checks, callback) {
  var json = jsonrpc(version, 'httptest.create', 5, checkParam('checks', checks), checkParam('authToken', authToken));
  var getId = function(result) { return result.httptestids; };
  post(defaultOptions.headers, defaultOptions.url, json, getId, callback);
}

function post(headers, url, json, processResult, callback) {
  request.post({headers: headers,
    url: url,
    body: JSON.stringify(json)}, function (err, res, body) {
    if (err) {
      callback(err);
      return;
    }
    if (res.statusCode !== 200) {
      callback('Response statusCode: ' + res.statusCode + ' ' +  body);
      return;
    }
    var bodyJson = JSON.parse(body);
    if (bodyJson.error) {
      callback(bodyJson.error);
    } else {
      callback(null, processResult(extractResult(bodyJson)));
    }
  });
}

function jsonrpc(version, method, requestId, params, auth) {
  return {'jsonrpc': checkParam('version', version),
    'method': checkParam('method', method),
    'id': checkParam('requestId', requestId),
    'auth': auth || null,
    'params': checkParam('params', params)
  };
}

function extractResult(json) {
  if (!json.result) {
    throw Error('No result was found in body response');
  }
  return json.result;
}

function checkParam(name, value) {
  if (!value) {
    throw Error(name + ' must be specified');
  }
  return value;
}
