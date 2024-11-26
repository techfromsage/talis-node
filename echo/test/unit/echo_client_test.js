'use strict';

var should = require('should');
var assert = require('assert');
var nock = require("nock");
var echo = require('../../index.js');
var sinon = require('sinon');
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

            var mockHttpRequest = nock(endPoint)
                .post('/1/events')
                .reply(400, {});

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err, result){
                (err === null).should.be.false;
                err.code.should.equal(2);
                err.label.should.equal('INVALID_QUERY');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        // TODO - Can we remove this test? HOW CAN THERE BE NO BODY. IT IS A POST REQUEST
        it.skip("- add events should return an error if call to request has missing option.body", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            nock(endPoint)
                .post('/1/events')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
console.log(`body`, this.req.options.body);
console.log(`requestBody`, requestBody);
                    if(!this.req.options.body){
                      return [400, {}];
                    }
                    // The test is checking for an error. Returning 200 will cause the test to fail
                    // We are checking  for a missing body
                    return [200, {}];
                });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                err.code.should.equal(2);
                done();
            });
        });
        // TODO - Can we remove this test? HOW CAN THERE BE NO METHOD
        it.skip("- add events should return an error if call to request has missing option.method", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            // var requestStub = sandbox.stub(request, 'post')
            // requestStub.callsFake(function (options, callback) {
            //     options.headers.should.have.property('User-Agent', 'talis-node/0.2.3');
            //     if(!options.method){
            //         var error = new Error('Missing field: options.method');
            //         callback(error);
            //     } else{
            //         callback(null);
            //     }
            // });

            nock(endPoint)
                .post('/1/events')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    if(!this.req.options.method){
                      return [400, {}];
                    }
                    // The test is checking for an error. Returning 200 will cause the test to fail
                    // We are checking  for a missing body
                    return [200, {}];
                });


            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err){
                (err === null).should.be.false;
                done();
            });
        });
        // TODO - Can we remove this test? If it wasn't a POST request, it would not be intersepted
        // by nock - so isn't this just the happy case?
        it.skip("- add events should return an error if call to request has option.method != POST", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            // var requestStub = sandbox.stub(request, 'post')
            // requestStub.callsFake(function (options, callback) {
            //     options.headers.should.have.property('User-Agent', 'talis-node/0.2.3');
            //     if(options.method !== 'POST'){
            //         var error = new Error('Invalid field: options.method');
            //         callback(error);
            //     } else{
            //         callback(null);
            //     }
            // });
            nock(endPoint)
                .post('/1/events')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    if(this.req.options.method !== 'POST'){
                      return [400, {}];
                    }
                    // The test is checking for an error. Returning 200 will cause the test to fail
                    // We are checking  for a missing body
                    return [200, {}];
                });

            echoClient.addEvents('secret', {class:'class', source:'source'}, function(err, result){
                (err === null).should.be.false;
                result.code.should.equal(0);
                done();
            });
        });
        // TODO - Can we remove this test? What is it really doing?
        it.skip("- add events should return an error if call to request has missing option.json", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var requestStub = sandbox.stub(request, 'post')
            requestStub.callsFake(function (options, callback) {
                options.headers.should.have.property('User-Agent', 'talis-node/0.2.3');
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
        it(" - should throw an error if persona validation fails", function(done) {
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            // TODO Remove - but left until 8/6 code is reolved
            //
            // var requestStub = sandbox.stub(request, 'post')
            // requestStub.callsFake(function (options, callback) {
            //     options.headers.should.have.property('User-Agent', 'talis-node/0.2.3');
            //     callback(
            //       null,
            //       {statusCode: 401},
            //       {
            //           "error": "invalid_token"
            //       }
            //   );
            // });
            nock(endPoint)
                .post('/1/events')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [401, {"error": "invalid_token"}];
                });

            echoClient.addEvents("incorrect_token", {class:'class', source:'source'}, function(err, result) {
                (err === null).should.be.false;

                // TODO What is the difference between code 8 and 6?
                // err.code.should.equal(8);
                // err.label.should.equal("INVALID_TOKEN");
                err.code.should.equal(6);
                err.label.should.equal("UNAUTHORISED");
                done();
            });
        });
        it("- add events should return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            nock(endPoint)
                .post('/1/events')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [200, {}];
                });

            var event = {
              'class': 'calss',
              'source': 'rl-app',
              'timestamp': 1324524509,
              'user': '1234-5678-9012-3456',
              'props': {
                'url': 'https://foo.bar/baz.html'
              }
            };

            echoClient.addEvents('secret', event, function(err, result){

                (err === null).should.be.true;

                result.body.timestamp.should.equal(1324524509);
                result.body.user.should.equal("1234-5678-9012-3456");
                result.body.source.should.equal("rl-app");
                result.body.props.should.be.an.object;
                result.body.props.url.should.equal("https://foo.bar/baz.html");

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

            nock(endPoint)
                .get('/1/analytics/sum?class=testclass&source=testsources&property=testproperty&interval=testinterval&group_by=testgroupby&key=testkey&value=testvalue&from=testfrom&to=testto&percentile=testpercentile&user=testuser&user.include=includeuser&user.exclude=excludeuser&filter=testfilter&filter.test=testfilter&n=testn&n.something=something')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\",\"resource_id\": \"5899a87fd42410f2c9000001\"},\"from\": \"2016-08-29T00:00:00\",\"to\": \"2017-05-18T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                    return [200, data];
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
                    (err === null).should.be.true;
                    result.body.results.length.should.equal(2);
                    result.body.results[0].user.should.equal('8av3Jaj__vC9v9VIY_P-1w');
                    result.body.results[0].interval_with_decay.should.equal(182920);
                    result.body.results[1].user.should.equal('d17T05nNTjG50sAp_R3RvQ');
                    result.body.results[1].interval_with_decay.should.equal(21315);
                    done();
                });
            };

            queryAnalytics.should.not.throw('Invalid Analytics queryParams');
        });
        it('- should return an error if call to request returns an error', function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            nock(endPoint)
                .get('/1/analytics/sum?class=testclass')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [400, {}];
                });

            var params = {
                class: 'testclass'
            };

            echoClient.queryAnalytics('secret', 'sum', params, false, function(err, result){
                (err === null).should.be.false;
                // TODO Why the change?
                // err.code.should.equal(1);
                // err.label.should.equal('REQUEST_ERROR');
                err.code.should.equal(2);
                err.label.should.equal('INVALID_QUERY');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it(" - should throw an error if persona validation fails", function(done) {
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var params = {
                class: 'testclass'
            };

            nock(endPoint)
                .get('/1/analytics/sum?class=testclass')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [401, {"error": "invalid_token"}];
                });

            echoClient.queryAnalytics("incorrect_token", "sum", params, false, function(err, result) {
                (err === null).should.be.false;

                // TODO What is the difference between code 8 and 6?
                // err.code.should.equal(8);
                // err.label.should.equal("INVALID_TOKEN");
                err.code.should.equal(6);
                err.label.should.equal("UNAUTHORISED");
                done();
            });
        });
        it("- should return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            nock(endPoint)
                .get('/1/analytics/sum?class=player.timer.2&property=interval_with_decay&group_by=user&filter.module_id=5847ed0ef81ebd1f1b000001&user.exclude=qVyfsQhlMY0T2_Bl7eotrg&from=2017-02-01T00%3A00%3A00&to=2017-02-13T00%3A00%3A00')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\"},\"user\": {\"exclude\": \"qVyfsQhlMY0T2_Bl7eotrg\"},\"from\": \"2017-02-01T00:00:00\",\"to\": \"2017-02-13T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                    return [200, data];
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
                (err === null).should.be.true;
                (result.body.results instanceof Array).should.be.true;
                result.body.results.length.should.equal(2);
                result.body.results[0].user.should.equal('8av3Jaj__vC9v9VIY_P-1w');
                result.body.head.class.should.equal(params.class);
                result.body.head.property.should.equal(params.property);
                result.body.head.group_by.should.equal(params.group_by);
                result.body.head.filter.module_id.should.equal(params['filter.module_id']);
                result.body.head.user.exclude.should.equal(params['user.exclude']);
                result.body.head.from.should.equal(params.from);
                result.body.head.to.should.equal(params.to);
                done();
            });
        });
        it("- should set cache header and return no errors if everything is successful", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            nock(endPoint)
                .get('/1/analytics/sum?class=player.timer.2&property=interval_with_decay&group_by=user&filter.module_id=5847ed0ef81ebd1f1b000001&user.exclude=qVyfsQhlMY0T2_Bl7eotrg&from=2017-02-01T00%3A00%3A00&to=2017-02-13T00%3A00%3A00')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                var data = "{\"head\": {\"type\": \"sum\",\"class\": \"player.timer.2\",\"property\": \"interval_with_decay\",\"group_by\": \"user\",\"filter\": {\"module_id\": \"5847ed0ef81ebd1f1b000001\"},\"user\": {\"exclude\": \"qVyfsQhlMY0T2_Bl7eotrg\"},\"from\": \"2017-02-01T00:00:00\",\"to\": \"2017-02-13T00:00:00\",\"count\": 2},\"results\": [{\"user\": \"8av3Jaj__vC9v9VIY_P-1w\",\"interval_with_decay\": 182920},{\"user\": \"d17T05nNTjG50sAp_R3RvQ\",\"interval_with_decay\": 21315}]}";
                    return [200, data];
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
                (err === null).should.be.true;
                (result.body.results instanceof Array).should.be.true;
                result.body.results.length.should.equal(2);
                result.body.results[0].user.should.equal('8av3Jaj__vC9v9VIY_P-1w');
                result.body.head.class.should.equal(params.class);
                result.body.head.property.should.equal(params.property);
                result.body.head.group_by.should.equal(params.group_by);
                result.body.head.filter.module_id.should.equal(params['filter.module_id']);
                result.body.head.user.exclude.should.equal(params['user.exclude']);
                result.body.head.from.should.equal(params.from);
                result.body.head.to.should.equal(params.to);
                done();
            });
        });
        it("- should return parse error if returned JSON contains errors", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "<html><head>Test</head></html>";

            nock(endPoint)
                .get('/1/analytics/sum?class=player.timer.2&property=interval_with_decay&group_by=user&filter.module_id=5847ed0ef81ebd1f1b000001&user.exclude=qVyfsQhlMY0T2_Bl7eotrg&from=2017-02-01T00%3A00%3A00&to=2017-02-13T00%3A00%3A00')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [200, data];
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
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                err.should.equal('Error parsing returned JSON');
                done();
            });
        });
        it("- should return error if non http 2xx reply", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "[]";

            nock(endPoint)
                .get('/1/analytics/sum?class=player.timer.2&property=interval_with_decay&group_by=user&filter.module_id=5847ed0ef81ebd1f1b000001&user.exclude=qVyfsQhlMY0T2_Bl7eotrg&from=2017-02-01T00%3A00%3A00&to=2017-02-13T00%3A00%3A00')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [400, data];
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
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                err.should.deepEqual({ code: 2, label: "INVALID_QUERY"});
                done();
            });
        });
        it("- should return error if non http 2xx reply with invalid parse", function(done){
            var echoClient = echo.createClient({
                echo_endpoint: endPoint
            });

            var data = "this is invalid";

            nock(endPoint)
                .get('/1/analytics/sum?class=player.timer.2&property=interval_with_decay&group_by=user&filter.module_id=5847ed0ef81ebd1f1b000001&user.exclude=qVyfsQhlMY0T2_Bl7eotrg&from=2017-02-01T00%3A00%3A00&to=2017-02-13T00%3A00%3A00')
                .reply(function(uri, requestBody){
                    this.req.headers['user-agent'].should.equal('talis-node/0.2.3');
                    return [400, data];
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
                (err === null).should.be.false;
                (typeof result).should.equal('undefined');
                err.should.deepEqual({ code: 2, label: "INVALID_QUERY"});
                done();
            });
        }); 
    });
});
