var assert = require('assert');
var rewire = require('rewire');
var sinon = require('sinon');
var expect = require('chai').expect
var proxyquire = require('proxyquire');
var fh_zabbix_mod = '../lib/fh-zabbix.js';

describe('fh_zabbix', function() {

  describe('forServer', function() {
    var forServer = rewire(fh_zabbix_mod).forServer;
    it('should throw if serverUrl is undefined', function() {
      expect(forServer.bind(forServer, undefined))
        .to.throw('url must be specified');
    });
  });

  describe('defaultOptions', function() {
    var serverUrl = 'http://zabbix.com';
    var fh_zabbix = rewire(fh_zabbix_mod);
    fh_zabbix.forServer(serverUrl);
    var options = fh_zabbix.__get__("defaultOptions");
    it('header "Content-Type" should be application/json-rpc', function() {
      expect(options.headers['Content-Type']).to.be.equal('application/json-rpc');
    });
    it('url should have been set to ' + serverUrl + '/api_jsonrpc.php', function() {
      expect(options.url).to.be.equal(serverUrl + '/api_jsonrpc.php');
    });
  });

  describe('extractResult', function() {
    var extractResult = rewire(fh_zabbix_mod).__get__('extractResult');
    it('should throw result is undefined', function() {
      expect(extractResult.bind(extractResult, '{}'))
        .to.throw('No result was found in body response');
    });
    it('should return token if it exists', function() {
      var response = {'result': '4ef016792e24df31c69950ab8ffdfedb'};
      var token = extractResult(response);
      expect(token).to.be.equal(response.result);
    });
  });

  describe('getAuthToken', function() {
    var request;
    var fh_zabbix;
    var authResponse;
    before(function() {
      authResponse = {
        'jsonrpc': 2.0,
        'result': '4ef016792e24df31c69950ab8ffdfedb',
        'id':1};
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 200}, JSON.stringify(authResponse));
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
    });
    it('should throw if username is undefined', function() {
      var getAuthToken = rewire(fh_zabbix_mod).__get__('getAuthToken');
      expect(getAuthToken.bind(getAuthToken, undefined, 'password'))
        .to.throw('username must be specified');
    });
    it('should throw if password is undefined', function() {
      var getAuthToken = rewire(fh_zabbix_mod).__get__('getAuthToken');
      expect(getAuthToken.bind(getAuthToken, 'admin', undefined))
        .to.throw('password must be specified');
    });
    it('post body.version should be 2.0', function() {
      fh_zabbix.getAuthToken('admin', 'zabbix', function(err, token) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.jsonrpc).to.be.equal('2.0');
    });
    it('post body.method should be user.login', function() {
      fh_zabbix.getAuthToken('admin', 'zabbix', function(err, token) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.method).to.be.equal('user.login');
    });
    it('post body.params in jsonrpc should contain username and password', function() {
      fh_zabbix.getAuthToken('admin', 'zabbix', function(err, token) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.params.user).to.be.equal('admin');
      expect(body.params.password).to.be.equal('zabbix');
    });
    it('response should contain auth token if username and password are correct', function(done) {
      fh_zabbix.getAuthToken('admin', 'zabbix', function(err, token) {
        expect(err).to.be.null;
        expect(token).to.be.equal(authResponse.result);
        done();
      });
    });
  });

  describe('jsonrpc', function() {
    var jsonrpc = rewire(fh_zabbix_mod).__get__('jsonrpc');
    it('should throw if version is undefined', function() {
      expect(jsonrpc.bind(jsonrpc, undefined))
        .to.throw('version must be specified');
    });
    it('should throw if method is undefined', function() {
      expect(jsonrpc.bind(jsonrpc, '2.0', undefined))
        .to.throw('method must be specified');
    });
    it('should throw if requestId is undefined', function() {
      expect(jsonrpc.bind(jsonrpc, '2.0', 'user.login', undefined))
        .to.throw('requestId must be specified');
    });
    it('should throw if params is undefined', function() {
      expect(jsonrpc.bind(jsonrpc, '2.0', 'user.login', 1, undefined))
        .to.throw('params must be specified');
    });
    it('auth may be null', function() {
      var json = jsonrpc('2.0', 'host.get', 1, {}, undefined);
      expect(json.jsonrpc).to.be.equal('2.0');
      expect(json.method).to.be.equal('host.get');
      expect(json.id).to.be.equal(1);
      expect(json.params).to.be.empty;
      expect(json.auth).to.be.null;
    });
  });

  describe('createWebScenarios', function() {
    var request;
    var fh_zabbix;
    var authResponse;
    beforeEach(function() {
      response = {
        'jsonrpc': 2.0,
        'result': {'httptestids': ['4']},
        'id':1};
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 200}, JSON.stringify(response));
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
    });
    it('should throw if auth token is undefined', function() {
      var createWebScenarios = rewire(fh_zabbix_mod).__get__('createWebScenarios');
      expect(createWebScenarios.bind(createWebScenarios, undefined, {}))
        .to.throw('authToken must be specified');
    });
    it('should throw if checks is undefined', function() {
      var createWebScenarios = rewire(fh_zabbix_mod).__get__('createWebScenarios');
      expect(createWebScenarios.bind(createWebScenarios, '12345', undefined))
        .to.throw('checks must be specified');
    });
    it('post body.method should be httptest.create', function() {
      fh_zabbix.createWebScenarios('123456', {}, function(err, httptestIds) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.method).to.be.equal('httptest.create');
    });
    it('auth token should have been added to the request body', function() {
      fh_zabbix.createWebScenarios('token', {}, function(err, httptestIds) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.auth).to.be.equal('token');
    });
    it('web checks should have been added to the request body', function() {
      var checks = {'name': 'Site XYZ Checks',
        'hostid': '1122',
        'steps': [
          {
            'name': 'Main Page',
            'url': 'https://xyz.com/main',
            'status_codes': 200,
            'no': 2
          }
        ]
      };
      fh_zabbix.createWebScenarios('token', checks, function(err, httptestIds) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.auth).to.be.equal('token');
      expect(body.params.name).to.be.equal('Site XYZ Checks');
      expect(body.params.hostid).to.be.equal('1122');
      expect(body.params.steps[0].name).to.be.equal('Main Page');
      expect(body.params.steps[0].url).to.be.equal('https://xyz.com/main');
      expect(body.params.steps[0].status_codes).to.be.equal(200);
      expect(body.params.steps[0].no).to.be.equal(2);
    });
  });

  describe('createHostGroup', function() {
    var request;
    var fh_zabbix;
    var authResponse;
    beforeEach(function() {
      response = {
        'jsonrpc': 2.0,
        'result': {'groupids': ['99999']},
        'id':1};
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 200}, JSON.stringify(response));
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
    });
    it('should throw authToken is undefined', function() {
      var createHostGroup = rewire(fh_zabbix_mod).__get__('createHostGroup');
      expect(createHostGroup.bind(createHostGroup, undefined, 'groupName'))
        .to.throw('authToken must be specified');
    });
    it('should throw groupName is undefined', function() {
      var createHostGroup = rewire(fh_zabbix_mod).__get__('createHostGroup');
      expect(createHostGroup.bind(createHostGroup, 'authToken', undefined))
        .to.throw('groupName must be specified');
    });
    it('host group should have been added request body', function() {
      fh_zabbix.createHostGroup('authToken', 'testGroup', function(err, groupId) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.auth).to.be.equal('authToken');
      expect(body.method).to.be.equal('hostgroup.create');
      expect(body.params.name).to.be.equal('testGroup');
    });
    it('groupid should be extracted from response', function(done) {
      fh_zabbix.createHostGroup('testGroup', 'authToken', function(err, groupId) {
        expect(err).to.be.null;
        expect(groupId).to.be.equal('99999');
        done();
      });
    });
  });

  describe('createHost', function() {
    var request;
    var fh_zabbix;
    var authResponse;
    var params = { 'host': 'MBaas Host',
      'interfaces': [
        {
          'type': 1, 
          'main': 1, 
          'useip': 1, 
          'ip': '127.0.0.1', 
          'dns': '', 
          'port': '10050'
        }
      ],
      'groups': [{ 'groupid': '99999'}]
    };
    beforeEach(function() {
      response = {
        'jsonrpc': 2.0,
        'result': {'hostids': ['88888']},
        'id':1};
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 200}, JSON.stringify(response));
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
    });
    it('should throw if authToken is undefined', function() {
      var createHost = rewire(fh_zabbix_mod).__get__('createHost');
      expect(createHost.bind(createHost, undefined, {}, function(err, hostid) {}))
        .to.throw('authToken must be specified');
    });
    it('should throw if params is undefined', function() {
      var createHost = rewire(fh_zabbix_mod).__get__('createHost');
      expect(createHost.bind(createHost, 'authToken', undefined, function(err, hostid){}))
        .to.throw('params must be specified');
    });
    it('should throw if callback is undefined', function() {
      var createHost = rewire(fh_zabbix_mod).__get__('createHost');
      expect(createHost.bind(createHost, 'authToken', undefined, function(err, hostid){}))
        .to.throw('params must be specified');
    });
    it('params should have been added request body', function() {
      fh_zabbix.createHost("authToken", params, function(err, groupId) {});
      var body = JSON.parse(request.post.getCall(0).args[0].body);
      expect(body.auth).to.be.equal('authToken');
      expect(body.method).to.be.equal('host.create');
      expect(body.params.host).to.be.equal('MBaas Host');
      expect(body.params.interfaces[0].type).to.be.equal(1);
      expect(body.params.interfaces[0].main).to.be.equal(1);
      expect(body.params.interfaces[0].useip).to.be.equal(1);
      expect(body.params.interfaces[0].ip).to.be.equal('127.0.0.1');
      expect(body.params.interfaces[0].dns).to.be.equal('');
      expect(body.params.interfaces[0].port).to.be.equal('10050');
      expect(body.params.groups[0].groupid).to.be.equal('99999');
    });
    it('hostid should be extracted from response', function(done) {
      fh_zabbix.createHost('authToken', params, function(err, hostId) {
        expect(err).to.be.null;
        expect(hostId).to.be.equal('88888');
        done();
      });
    });
  });

  describe('authenticate', function() {
    var request;
    var fh_zabbix;
    var authResponse;
    before(function() {
      authResponse = {
        'jsonrpc': 2.0,
        'result': '4ef016792e24df31c69950ab8ffdfedb',
        'id':1};
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 200}, JSON.stringify(authResponse));
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
    });
    it('should return createHostGroup closure', function() {
      fh_zabbix.authenticate("Admin", 'zabbix', function(err, functions) {
        expect(err).to.be.null;
        expect(functions.createHostGroup).to.be.defined;
      });
    });
    it('should return createHost closure', function() {
      fh_zabbix.authenticate("Admin", 'zabbix', function(err, functions) {
        expect(err).to.be.null;
        expect(functions.createHost).to.be.defined;
      });
    });
    it('should return createWebScenarios closure', function() {
      fh_zabbix.authenticate("Admin", 'zabbix', function(err, functions) {
        expect(err).to.be.null;
        expect(functions.createWebScenarios).to.be.defined;
      });
    });
  });

  describe('post', function() {
    it('should call callback error if status code is not 200', function(done) {
      request = sinon.stub();
      request.post = sinon.stub().yields(null, {statusCode: 404}, "Not found");
      fh_zabbix = proxyquire(fh_zabbix_mod, {'request': request}).forServer('http://zabbix.com');
      fh_zabbix.createWebScenarios('1234', {}, function(error, body) {
        expect(error).to.be.equal('Response statusCode: 404 Not found');
        done();
      });
    });
  });

});

