'use strict';

var should = require('should');
var assert = require('assert');
var echo = require('../../index.js');
var sinon = require('sinon');
var request = require('request');
var sandbox;
var endPoint = 'http://echo:3002';

beforeEach(function () {
    sandbox = sinon.sandbox.create();
});

afterEach(function () {
    sandbox.restore();
});

describe("Echo Node Client Test Suite", function(){
    describe("- Constructor tests", function(){
        it("- should throw error if config.echo_endpoint is not supplied", function(done){
            var echoClient = function(){
                return echo.createClient({});
            };
            echoClient.should.throw("Missing Echo config: echo_endpoint");
            done();
        });
        it("- should NOT throw any error if all config params are defined", function(done){
            var echoClient = function(){
                return echo.createClient({
                    echo_endpoint:"http://echo:3002"
            });
            };
            echoClient.should.not.throw();
            done();
        });
    });

    describe("- add events test", function(){
        it("- should throw error if no persona token supplied", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var addEvents = function(){
                return echoClient.addEvents(null, null, function(err, result){});
            };

            addEvents.should.throw("Missing Persona token");
            done();
        });
        it("- should throw error if no data supplied", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var addEvents = function(){
                return echoClient.addEvents('secret', null, function(err, result){});
            };

            addEvents.should.throw("Missing data");
            done();
        });
        it("- should throw error if data.class not supplied", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var addEvents = function(){
                return echoClient.addEvents('secret', {}, function(err, result){});
            };

            addEvents.should.throw("Missing field data.class");
            done();
        });
        it("- should throw error if data.source not supplied", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var addEvents = function(){
                return echoClient.addEvents('secret', {class:'test'}, function(err, result){});
            };

            addEvents.should.throw("Missing field data.source");
            done();
        });
        it("- add events should return an error if call to request returns an error", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post');
            requestStub.yields(new Error('Error communicating with Echo'));

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err, result){
                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Echo');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- add events should return an error if call to request has missing option.body", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post', function (options, callback) {
                if(!options.body){
                    var error = new Error('Missing field: options.body');
                    callback(error);
                } else{
                    callback(null);
                }
            });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                done();
            });
        });
        it("- add events should return an error if call to request has missing option.method", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post', function (options, callback) {
                if(!options.method){
                    var error = new Error('Missing field: options.method');
                    callback(error);
                } else{
                    callback(null);
                }
            });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                done();
            });
        });
        it("- add events should return an error if call to request has option.method != POST", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post', function (options, callback) {
                if(options.method !== 'POST'){
                    var error = new Error('Invalid field: options.method');
                    callback(error);
                } else{
                    callback(null);
                }
            });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                done();
            });
        });
        it("- add events should return an error if call to request has missing option.json", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post', function (options, callback) {
                if(!options.json){
                    var error = new Error('Missing field: options.json');
                    callback(error);
                } else{
                    callback(null);
                }
            });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                done();
            });
        });
        it("- add events should return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post', function (options, callback) {
                callback(
                  null,
                  {statusCode: 200},
                  {
                    "class": "page.views",
                    "timestamp": 1324524509,
                    "user": "1234-5678-9012-3456",
                    "source" : "rl-app",
                    "props": {
                        "url" : "https://foo.bar/baz.html"
                    }
                  }
              );
            });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err, result){

                (err === null).should.be.true;

                result.timestamp.should.equal(1324524509);
                result.user.should.equal("1234-5678-9012-3456");
                result.source.should.equal("rl-app");
                result.props.should.be.an.object;
                result.props.url.should.equal("https://foo.bar/baz.html");

                done();
            });
        });
    });

    describe('- query analytics tests', function(){
        it('- should throw error if no persona token supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var queryAnalytics = function(){
                return echoClient.queryAnalytics(null, null, null, false, function(err, result){});
            };

            queryAnalytics.should.throw('Missing Persona token');
            done();
        });
        it('- should throw error if no query operator supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var queryAnalytics = function(){
                return echoClient.queryAnalytics('secret', null, null, false, function(err, result){});
            };

            queryAnalytics.should.throw('Missing Analytics queryOperator');
            done();
        });
        it('- should throw error if invalid query operator supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var queryAnalytics = function(){
                return echoClient.queryAnalytics('secret', 'duff', null, false, function(err, result){});
            };

            queryAnalytics.should.throw('Invalid Analytics queryOperator');
            done();
        });
        it('- should throw error if no query parameters supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var queryAnalytics = function(){
                return echoClient.queryAnalytics('secret', 'sum', null, false, function(err, result){});
            };

            queryAnalytics.should.throw('Missing Analytics queryParams');
            done();
        });
        it('- should throw error if invalid query parameters supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var params = {
                duffParam: 'duffValue'
            };

            var queryAnalytics = function(){
                return echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){});
            };

            queryAnalytics.should.throw('Invalid Analytics queryParams');
            done();
        });
        it('- should not throw an error if valid query parameters supplied', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\",\"resource_id\": \"5899a87fd42410f2c9000001\"},\"from\": \"2016-08-29T00:00:00\",\"to\": \"2017-05-18T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                callback(null, {statusCode: 200}, data);
            });

            var params = {
                class: 'testclass',
                source: 'testsources',
                property: 'testproperty',
                interval: 'testinterval',
                group_by: 'testgroupby',
                key: 'testkey',
                value: 'testvalue',
                from: 'testfrom',
                to: 'testto',
                percentile: 'testpercentile',
                user: 'testuser',
                'user.include': 'includeuser',
                'user.exclude': 'excludeuser',
                filter: 'testfilter',
                'filter.test': 'testfilter',
                n: 'testn',
                'n.something': 'something'
            };

            var queryAnalytics = function(){
                return echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                    var firstCall = requestStub.firstCall;
                    (err === null).should.be.true;
                    requestStub.callCount.should.equal(1);
                    firstCall.args[0].method.should.equal('GET');
                    firstCall.args[0].url.should.equal(endPoint + '/1/analytics/sum?class=testclass&source=testsources&property=testproperty&interval=testinterval&group_by=testgroupby&key=testkey&value=testvalue&from=testfrom&to=testto&percentile=testpercentile&user=testuser&user.include=includeuser&user.exclude=excludeuser&filter=testfilter&filter.test=testfilter&n=testn&n.something=something');
                    firstCall.args[0].headers['cache-control'].should.equal('none');
                });
            };

            queryAnalytics();

            queryAnalytics.should.not.throw('Invalid Analytics queryParams');

            done();
        });
        it('- should return an error if call to request returns an error', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                callback(new Error('Error communicating with Echo'));
            });

            var params = {
                class: 'testclass'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.false;
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].url.should.equal(endPoint + '/1/analytics/sum?class=testclass');
                firstCall.args[0].headers['cache-control'].should.equal('none');
                err.message.should.equal('Error communicating with Echo');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\"},\"user\": {\"exclude\": \"qVyfsQhlMY0T2_Bl7eotrg\"},\"from\": \"2017-02-01T00:00:00\",\"to\": \"2017-02-13T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                callback(null, {statusCode: 200}, data);
            });

            var params = {
                class: 'player.timer.2',
                property: 'interval_with_decay',
                group_by: 'user',
                'filter.module_id': '5847ed0ef81ebd1f1b000001',
                'user.exclude': 'qVyfsQhlMY0T2_Bl7eotrg',
                from: '2017-02-01T00:00:00',
                to: '2017-02-13T00:00:00'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.true;
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].headers['cache-control'].should.equal('none');
                (result.results instanceof Array).should.be.true;
                result.results.length.should.equal(2);
                result.results[0].user.should.equal('8av3Jaj__vC9v9VIY_P-1w');
                result.head.class.should.equal(params.class);
                result.head.property.should.equal(params.property);
                result.head.group_by.should.equal(params.group_by);
                result.head.filter.module_id.should.equal(params['filter.module_id']);
                result.head.user.exclude.should.equal(params['user.exclude']);
                result.head.from.should.equal(params.from);
                result.head.to.should.equal(params.to);
                done();
            });
        });
        it("- should set cache header and return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\"},\"user\": {\"exclude\": \"qVyfsQhlMY0T2_Bl7eotrg\"},\"from\": \"2017-02-01T00:00:00\",\"to\": \"2017-02-13T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                callback(null, {statusCode: 200}, data);
            });

            var params = {
                class: 'player.timer.2',
                property: 'interval_with_decay',
                group_by: 'user',
                'filter.module_id': '5847ed0ef81ebd1f1b000001',
                'user.exclude': 'qVyfsQhlMY0T2_Bl7eotrg',
                from: '2017-02-01T00:00:00',
                to: '2017-02-13T00:00:00'
            };

            echoClient.queryAnalytics('secret', 'sum', params, true, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.true;
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].headers.should.not.contain('cache-control');
                (result.results instanceof Array).should.be.true;
                result.results.length.should.equal(2);
                result.results[0].user.should.equal('8av3Jaj__vC9v9VIY_P-1w');
                result.head.class.should.equal(params.class);
                result.head.property.should.equal(params.property);
                result.head.group_by.should.equal(params.group_by);
                result.head.filter.module_id.should.equal(params['filter.module_id']);
                result.head.user.exclude.should.equal(params['user.exclude']);
                result.head.from.should.equal(params.from);
                result.head.to.should.equal(params.to);
                done();
            });
        });
        it("- should return parse error if returned JSON contains errors", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "<html><head>Test</head></html>";

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                callback(null, {statusCode: 200}, data);
            });

            var params = {
                class: 'player.timer.2',
                property: 'interval_with_decay',
                group_by: 'user',
                'filter.module_id': '5847ed0ef81ebd1f1b000001',
                'user.exclude': 'qVyfsQhlMY0T2_Bl7eotrg',
                from: '2017-02-01T00:00:00',
                to: '2017-02-13T00:00:00'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].headers['cache-control'].should.equal('none');
                err.should.equal('Error parsing returned JSON');
                done();
            });
        });
        it("- should return error if non http 2xx reply", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "[]";

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                callback(null, {statusCode: 400}, data);
            });

            var params = {
                class: 'player.timer.2',
                property: 'interval_with_decay',
                group_by: 'user',
                'filter.module_id': '5847ed0ef81ebd1f1b000001',
                'user.exclude': 'qVyfsQhlMY0T2_Bl7eotrg',
                from: '2017-02-01T00:00:00',
                to: '2017-02-13T00:00:00'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].headers['cache-control'].should.equal('none');
                err.should.equal('error response status code: 400');
                done();
            });
        });
        it("- should return error if non http 2xx reply with invalid parse", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "this is invalid";

            var requestStub = sandbox.stub(request, 'get', function(options, callback) {
                callback(null, {statusCode: 400}, data);
            });

            var params = {
                class: 'player.timer.2',
                property: 'interval_with_decay',
                group_by: 'user',
                'filter.module_id': '5847ed0ef81ebd1f1b000001',
                'user.exclude': 'qVyfsQhlMY0T2_Bl7eotrg',
                from: '2017-02-01T00:00:00',
                to: '2017-02-13T00:00:00'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                var firstCall = requestStub.firstCall;
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                requestStub.callCount.should.equal(1);
                firstCall.args[0].method.should.equal('GET');
                firstCall.args[0].headers['cache-control'].should.equal('none');
                err.should.equal('error response status code: 400');
                done();
            });
        });    });
});
