'use strict';

var should = require('should'),
    assert = require('assert'),
    babel = require('../../index.js'),
    rewire = require("rewire");

describe("Babel Node Client Test Suite", function(){
    describe("- Constructor tests", function(){
        it("- should throw error if config.babel_host is not supplied", function(){
            var babelClient = function(){
                return babel.createClient({});
            };
            babelClient.should.throw("Missing Babel config: babel_host");
        });

        it("- should throw error if config.babel_port is not supplied", function(){
            var babelClient = function(){
                return babel.createClient({babel_host:'babel'});
            };
            babelClient.should.throw("Missing Babel config: babel_port");
        });

        it("- should throw error if config.babel_host doesn't start with http/https", function(){
            var babelClient = function(){
                return babel.createClient({
                    babel_host:'babel',
                    babel_port:3000});
            };
            babelClient.should.throw("Invalid Babel config: babel_host");
        });

        it("- should NOT throw any error if all config params are defined", function(){
            var babelClient = function(){
                return babel.createClient({
                    babel_host:"http://babel",
                    babel_port:3000
                });
            };
            babelClient.should.not.throw();
        });
    });

    describe("- Head Target Feed tests", function(){
        it("- should throw error if no target supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var headTargetFeed = function(){
                return babelClient.headTargetFeed(null, null, null, function(err, response){});
            };

            headTargetFeed.should.throw("Missing target");
        });
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var headTargetFeed = function(){
                return babelClient.headTargetFeed('TARGET', null, null, function(err, response){});
            };

            headTargetFeed.should.throw("Missing Persona token");
        });

        it("- should return an error if call to request returns an error when head target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(new Error('Error communicating with Babel'));
            };

            babel.__set__("request", requestStub);

            babelClient.headTargetFeed('TARGET', 'secret', {}, function(err, response){

                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return an error (401) if persona token is invalid when head target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:401});
            };

            babel.__set__("request", requestStub);

            babelClient.headTargetFeed('TARGET', 'secret', {}, function(err, response){

                (err === null).should.be.false;
                err.http_code.should.equal(401);
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return an error (404) if babel returns no feed when head target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:404});
            };

            babel.__set__("request", requestStub);

            babelClient.headTargetFeed('TARGET', 'secret', {}, function(err, response){
                (err === null).should.be.false;
                err.http_code.should.equal(404);
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should not return an error if no params set and response from babel is ok when head target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {statusCode:204, headers:{'x-feed-new-items': '1'}});
            };

            babel.__set__("request", requestStub);

            babelClient.headTargetFeed('TARGET', 'secret', function(err, response){
                (err === null).should.be.true;
                response.headers.should.have.property('x-feed-new-items', '1');
                done();
            });
        });
        it("- should return response if no error from babel and feed is found with empty params when head target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {statusCode:204, headers:{'x-feed-new-items': '2'}});
            };

            babel.__set__("request", requestStub);

            babelClient.headTargetFeed('TARGET', 'secret', {}, function(err, response){
                (err === null).should.be.true;
                response.headers.should.have.property('x-feed-new-items', '2');
                done();
            });
        });
    });
    describe("- Get Target Feed tests", function(){

        it("- should throw error if no target supplied", function(){
            var babelClient = babel.createClient({
                    babel_host:"http://babel",
                    babel_port:3000
                });

            var getTargetFeed = function(){
                return babelClient.getTargetFeed(null, null, null, function(err, result){});
            };

            getTargetFeed.should.throw("Missing target");
        });
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getTargetFeed = function(){
                return babelClient.getTargetFeed('TARGET', null, null, function(err, result){});
            };

            getTargetFeed.should.throw("Missing Persona token");
        });
        it("- should not cause an error if no options passed in", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, JSON.stringify({}));
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', null, function(err){
                (err === null).should.be.true;
                done();
            });
        });

        it("- should return an error if call to request returns an error when get target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(new Error('Error communicating with Babel'));
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', {}, function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error (401) if persona token is invalid when get target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:401}, JSON.stringify({error:"invalid_token", error_description:"The token is invalid or has expired"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', {}, function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal('The token is invalid or has expired');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error (404) if babel returns no feed when get target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {}, JSON.stringify({"error":"feed_not_found", "error_description":"Feed not found"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', {}, function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(404);
                err.message.should.equal('Feed not found');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return results if no error from babel and feed is found when get target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, JSON.stringify({
                    "count":2,
                    "limit":25,
                    "offset":0,
                    "annotations":[{
                        "annotatedBy":"rg",
                        "_id":"54c107db52be6b4d90000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:23:23.013Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    },{
                        "annotatedBy":"rg",
                        "_id":"54c10857ae44b3f492000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:25:27.294Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    }]
                }));
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', {}, function(err, result){

                (err === null).should.be.true;
                result.count.should.equal(2);
                result.limit.should.equal(25);
                result.annotations.should.have.lengthOf(2);
                done();
            });
        });
        it("- should not blow up if invalid JSON returned", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, null);
            };

            babel.__set__("request", requestStub);

            babelClient.getTargetFeed('TARGET', 'secret', {}, function(err, result){

              (err === null).should.be.false;
              err.message.should.equal('Error parsing JSON: null');
              (typeof result).should.equal('undefined');
                done();
            });
        });
    });

    describe("- Test Querying Multiple Feeds", function(){
        it("- should throw error if no feed ids supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getFeeds = function(){
                return babelClient.getFeeds(null, null, function(err, result){});
            };

            getFeeds.should.throw("Missing feeds");
        });
        it("- should throw error if feeds is an empty array", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getFeeds = function(){
                return babelClient.getFeeds([], null, function(err, result){});
            };

            getFeeds.should.throw("Feeds should be an array and must not be empty");
        });
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getFeeds = function(){
                return babelClient.getFeeds(['FEED1'], null, function(err, result){});
            };

            getFeeds.should.throw("Missing Persona token");
        });

        it("- should return an error if call to request returns an error when get feeds", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(new Error('Error communicating with Babel'));
            };

            babel.__set__("request", requestStub);

            babelClient.getFeeds(['FEED1'], 'secret', function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error (401) if persona token is invalid when get feeds", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:401}, JSON.stringify({error:"invalid_token", error_description:"The token is invalid or has expired"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getFeeds(['FEED1'], 'secret', function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal('The token is invalid or has expired');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error (404) if babel returns no feeds when get feeds", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {}, JSON.stringify({"error":"feed_not_found", "error_description":"Feed not found"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getFeeds(['FEED1'], 'secret', function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(404);
                err.message.should.equal('Feed not found');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return results if no error from babel and feeds are found when get feeds", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, JSON.stringify({
                    "feed_length":2,
                    "limit":25,
                    "offset":0,
                    "feeds":[{
                        feed_id: "FEED1",
                        status: "success"
                    },{
                        feed_id: "FEED2",
                        status: "success"
                    }],
                    "annotations":[{
                        "annotatedBy":"ns",
                        "_id":"54c107db52be6b4d90000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:23:23.013Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    },{
                        "annotatedBy":"ns",
                        "_id":"54c10857ae44b3f492000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:25:27.294Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    }]
                }));
            };

            babel.__set__("request", requestStub);

            babelClient.getFeeds(['FEED1', ['FEED2']], 'secret', function(err, result){

                (err === null).should.be.true;
                result.feed_length.should.equal(2);
                result.limit.should.equal(25);
                result.annotations.should.have.lengthOf(2);
                done();
            });
        });
        it("- should not blow up if invalid JSON returned", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, null);
            };

            babel.__set__("request", requestStub);

            babelClient.getFeeds(['FEED1', ['FEED2']], 'secret', function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error parsing JSON: null');
                (typeof result).should.equal('undefined');
                done();
            });
        });
    });

    describe("- Get Annotation tests", function(){
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getAnnotations = function(){
                return babelClient.getAnnotation(null, null, function(err, result){});
            };

            getAnnotations.should.throw("Missing Persona token");
        });
        it("- should cause an error if no annotation ID is passed in", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getAnnotations = function(){
                return babelClient.getAnnotation("secret", null, function(err, result){});
            };

            getAnnotations.should.throw("Missing annotation ID");
        });

        it("- should return an error (401) if persona token is invalid", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:401}, JSON.stringify({error:"invalid_token", error_description:"The token is invalid or has expired"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotation("secret", "id", function(err, result){
                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal("The token is invalid or has expired");
                (typeof result).should.equal("undefined");
                done();
            });
        });

        it("- should return an error if call to request returns an error", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(new Error("Error communicating with Babel"));
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotation("secret", "id", function(err, result){

                (err === null).should.be.false;
                err.message.should.equal("Error communicating with Babel");
                (typeof result).should.equal("undefined");
                done();
            });
        });

        it("- should return a single annotation if no error from babel", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = function(options, callback){
                callback(null, {}, JSON.stringify({
                    "__v": 0,
                    "annotatedBy": "bp",
                    "hasTarget": {
                        "fragment": "p=1",
                        "uri": "my/uri"
                    },
                    "_id": "5628b931a394fb449e000247",
                    "annotatedAt": "2015-10-22T10:23:45.154Z",
                    "motivatedBy": "annotating",
                    "hasBody": {
                        "format": "text/plain",
                        "type": "Text",
                        "details": {
                            "platform": "web"
                        }
                    }
                }));
            };

            babel.__set__("request", requestMock);

            babelClient.getAnnotation("secret", "5628b931a394fb449e000247", function(err, result){

                (err === null).should.be.true;
                result._id.should.equal("5628b931a394fb449e000247");
                done();
            });
        });
        it("- should not blow up if invalid JSON returned", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
                callback(null, {}, null);
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotation('secret', "id", function(err, result){

                (err === null).should.be.false;
                err.message.should.equal("Error parsing JSON: null");
                (typeof result).should.equal("undefined");
                done();
            });
        });
    });

    describe("- Get Annotations Feed tests", function(){
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getAnnotations = function(){
                return babelClient.getAnnotations(null, null, function(err, result){});
            };

            getAnnotations.should.throw("Missing Persona token");
        });
        it("- should not cause an error if no options passed in", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var getAnnotations = function(){
                return babelClient.getAnnotations('secret', null, function(err, result){});
            };

            getAnnotations.should.not.throw();
        });

        it("- should return an error (401) if persona token is invalid when get target feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(null, {statusCode:401}, JSON.stringify({error:"invalid_token", error_description:"The token is invalid or has expired"}));
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotations('secret', {}, function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal('The token is invalid or has expired');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error if call to request returns an error when annotations feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = function(options, callback){
                callback(new Error('Error communicating with Babel'));
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotations('secret', {}, function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return results if no error from babel when annotations feed", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = function(options, callback){
                callback(null, {}, JSON.stringify({
                    "count":2,
                    "limit":25,
                    "offset":0,
                    "annotations":[{
                        "annotatedBy":"rg",
                        "_id":"54c107db52be6b4d90000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:23:23.013Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    },{
                        "annotatedBy":"rg",
                        "_id":"54c10857ae44b3f492000001",
                        "__v":0,
                        "annotatedAt":"2015-01-22T14:25:27.294Z",
                        "motivatedBy":"commenting",
                        "hasTarget":{},
                        "hasBody":{}
                    }]
                }));
            };

            babel.__set__("request", requestMock);

            babelClient.getAnnotations('secret', {}, function(err, result){

                (err === null).should.be.true;
                result.count.should.equal(2);
                result.limit.should.equal(25);
                result.annotations.should.have.lengthOf(2);
                done();
            });
        });
        it("- should not blow up if invalid JSON returned", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestStub = function(options, callback){
               callback(null, {}, null);
            };

            babel.__set__("request", requestStub);

            babelClient.getAnnotations('secret', {}, function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error parsing JSON: null');
                (typeof result).should.equal('undefined');
                done();
            });
        });
    });

    describe("- Test creation of an annotation", function(){
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation(null, null, null, function(err, result){});
            };

            createAnnotation.should.throw("Missing Persona token");
        });
        it("- should return an error if no hasBody supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasBody");
        });
        it("- should return an error if no hasBody.format supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{}}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasBody.format");
        });

        it("- should return an error if no hasBody.type supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain'}}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasBody.type");
        });
        it("- should return an error if no annotatedBy supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: annotatedBy");
        });
        it("- should return an error if hasTarget not supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasTarget");
        });
        it("- should return an error if hasTarget as single object has no uri supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:{}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasTarget.uri is required");
        });
        it("- should return an error if hasTarget as array contains one or more objects with no uri", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:[{uri: 'foo'}, {}], annotatedBy:'Gordon Freeman'}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Missing data: hasTarget.uri is required");
        });
        it("- should return an error if hasTarget contains unrecognised property", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:{uri: 'foo', something:'else'}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){});
            };

            createAnnotation.should.throw("Invalid data: hasTarget has unrecognised property 'something'");
        });
        it("- should return an error if hasTarget as array contains one or more objects with unrecognised property", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var createAnnotation = function(){
                return babelClient.createAnnotation('token', {hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:[{uri: 'foo'},{uri: 'foo', something:'else'}], annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            createAnnotation.should.throw("Invalid data: hasTarget has unrecognised property 'something'");
        });
        it("- should return an error (401) if persona token is invalid", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                post:function(options, callback){
                    var error = new Error('The token is invalid or has expired');
                    error.http_code = 401;
                    callback(error);
                }
            };

            babel.__set__("request", requestStub);

            babelClient.createAnnotation('secret', {hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'},  {}, function(err, result){

                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal('The token is invalid or has expired');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error if call to request returns an error", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                post:function(options, callback){
                    var error = new Error('Error communicating with Babel');
                    callback(error);
                }
            };

            babel.__set__("request", requestStub);

            babelClient.createAnnotation('secret', {hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error if call to request returns a none 200 response", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                post:function(options, callback){
                   var response = {statusCode: 400};
                    callback(null, response, {body:'', message:'Bad Request'});
                }
            };

            babel.__set__("request", requestStub);

            babelClient.createAnnotation('secret', {hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){

                (err === null).should.be.false;
                err.message.should.equal('Bad Request');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return no errors if everything is successful", function(done){

            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = {};
            requestMock.post = function(options, callback){
                callback(null, {statusCode: 201}, {
                    __v: 0,
                    annotatedBy: 'Gordon Freeman',
                    _id: '12345678901234567890',
                    annotatedAt: '2015-02-03T10:28:37.725Z',
                    motivatedBy: 'The Combine',
                    hasTarget: {
                        uri: 'http://example.com/uri'
                    },
                    hasBody:{
                        format: 'text/plain',
                        type: 'Text',
                        uri: 'http://example.com/another/uri',
                        chars: "Eeeee it's dark! Where's that elevator? Eeeee!",
                        details:{
                            who: 'Gordon Freeman',
                            text: "Why don't we have a robot or something to push this sample into the core? This looks sort of dangerous."
                        }
                    }
                });
            };

            babel.__set__("request", requestMock);

            babelClient.createAnnotation('secret', {hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, {}, function(err, result){

                (err === null).should.be.true;

                result.annotatedBy.should.equal('Gordon Freeman');
                result.hasTarget.uri.should.equal('http://example.com/uri');
                result.hasBody.uri.should.equal('http://example.com/another/uri');
                done();
            });
        });

        it("- should correctly treat the third parameter as the callback when called with three parameters ", function(done){

            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = {};
            requestMock.post = function(options, callback){
                callback(null, {statusCode: 201}, {
                    __v: 0,
                    annotatedBy: 'Gordon Freeman',
                    _id: '12345678901234567890',
                    annotatedAt: '2015-02-03T10:28:37.725Z',
                    motivatedBy: 'The Combine',
                    hasTarget: {
                        uri: 'http://example.com/uri'
                    },
                    hasBody:{
                        format: 'text/plain',
                        type: 'Text',
                        uri: 'http://example.com/another/uri',
                        chars: "Eeeee it's dark! Where's that elevator? Eeeee!",
                        details:{
                            who: 'Gordon Freeman',
                            text: "Why don't we have a robot or something to push this sample into the core? This looks sort of dangerous."
                        }
                    }
                });
            };

            babel.__set__("request", requestMock);

            babelClient.createAnnotation('secret', {hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, function(err, result){

                (err === null).should.be.true;

                result.annotatedBy.should.equal('Gordon Freeman');
                result.hasTarget.uri.should.equal('http://example.com/uri');
                result.hasBody.uri.should.equal('http://example.com/another/uri');
                done();
            });
        });
    });

    describe("- Test generation of query string params", function(){
        it("- should return empty string if no params passed in", function(){
          var babel = require("../../index.js");

          var babelClient = babel.createClient({
            babel_host:"http://babel",
            babel_port:3000
          });

          babelClient._queryStringParams().should.equal('');
        });
        it("- should return empty string if params not an object", function(){
          var babel = require("../../index.js");

          var babelClient = babel.createClient({
            babel_host:"http://babel",
            babel_port:3000
          });

          babelClient._queryStringParams('').should.equal('');
        });
        it("- should return string with one key value pair", function(){
          var babel = require("../../index.js");

          var babelClient = babel.createClient({
            babel_host:"http://babel",
            babel_port:3000
          });

          babelClient._queryStringParams({testk1:'testv1'}).should.equal('testk1=testv1');
        });
        it("- should return string with one key value pair with url encoded strings", function(){
            var babel = require("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            babelClient._queryStringParams({testk1:'testv1=encoded'}).should.equal('testk1=testv1%3Dencoded');
        });

        it("- should return string with multiple key value pairs", function(){
          var babel = require("../../index.js");

          var babelClient = babel.createClient({
            babel_host:"http://babel",
            babel_port:3000
          });

          babelClient._queryStringParams({testk1:'testv1',testk2:'testv2',testk3:'testv3'}).should.equal('testk1=testv1&testk2=testv2&testk3=testv3');
        });
    });

    describe("- Test update of an annotation", function(){
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation(null, null, function(err, result){});
            };

            updateAnnotation.should.throw("Missing Persona token");
        });
        it("- should return an error if no _id supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: _id");
        });
        it("- should return an error if no hasBody supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid'}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasBody");
        });
        it("- should return an error if no hasBody.format supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{}}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasBody.format");
        });

        it("- should return an error if no hasBody.type supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain'}}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasBody.type");
        });
        it("- should return an error if no annotatedBy supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: annotatedBy");
        });
        it("- should return an error if hasTarget not supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}, annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasTarget");
        });
        it("- should return an error if hasTarget as single object has no uri supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:{}, annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasTarget.uri is required");
        });
        it("- should return an error if hasTarget as array contains one or more objects with no uri", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:[{uri: 'foo'}, {}], annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            updateAnnotation.should.throw("Missing data: hasTarget.uri is required");
        });
        it("- should return an error if hasTarget contains unrecognised property", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:{uri: 'foo', something:'else'}, annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            updateAnnotation.should.throw("Invalid data: hasTarget has unrecognised property 'something'");
        });
        it("- should return an error if hasTarget as array contains one or more objects with unrecognised property", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var updateAnnotation = function(){
                return babelClient.updateAnnotation('token', {_id: 'testid', hasBody:{format:'text/plain', 'type':'Text'}, hasTarget:[{uri: 'foo'},{uri: 'foo', something:'else'}], annotatedBy:'Gordon Freeman'}, function(err, result){});
            };

            updateAnnotation.should.throw("Invalid data: hasTarget has unrecognised property 'something'");
        });
        it("- should return an error (401) if persona token is invalid", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                put:function(options, callback){
                    var error = new Error('The token is invalid or has expired');
                    error.http_code = 401;
                    callback(error);
                }
            };

            babel.__set__("request", requestStub);

            babelClient.updateAnnotation('secret', {_id: 'testid', hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, function(err, result){
                (err === null).should.be.false;
                err.http_code.should.equal(401);
                err.message.should.equal('The token is invalid or has expired');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error if call to request returns an error", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                put:function(options, callback){
                    var error = new Error('Error communicating with Babel');
                    callback(error);
                }
            };

            babel.__set__("request", requestStub);

            babelClient.updateAnnotation('secret', {_id: 'testid', hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, function(err, result){
                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return an error if call to request returns a none 200 response", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                put:function(options, callback){
                    var response = {statusCode: 400};
                    callback(null, response, {body:'', message:'Bad Request'});
                }
            };

            babel.__set__("request", requestStub);

            babelClient.updateAnnotation('secret', {_id: 'testid', hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, function(err, result){
                (err === null).should.be.false;
                err.message.should.equal('Bad Request');
                (typeof result).should.equal('undefined');
                done();
            });
        });

        it("- should return no errors if everything is successful", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = {};
            requestMock.put = function(options, callback){
                callback(null, {statusCode: 200}, {
                    __v: 0,
                    annotatedBy: 'Gordon Freeman',
                    _id: '12345678901234567890',
                    annotatedAt: '2015-02-03T10:28:37.725Z',
                    motivatedBy: 'The Combine',
                    hasTarget: {
                        uri: 'http://example.com/uri'
                    },
                    hasBody:{
                        format: 'text/plain',
                        type: 'Text',
                        uri: 'http://example.com/another/uri',
                        chars: "Eeeee it's dark! Where's that elevator? Eeeee!",
                        details:{
                            who: 'Gordon Freeman',
                            text: "Why don't we have a robot or something to push this sample into the core? This looks sort of dangerous."
                        }
                    }
                });
            };

            babel.__set__("request", requestMock);

            babelClient.updateAnnotation('secret', {_id: 'testid', hasBody:{format:'text/plain', type:'Text'}, hasTarget:{uri:'http://example.com'}, annotatedBy:'Gordon Freeman'}, function(err, result){
                (err === null).should.be.true;
                result.annotatedBy.should.equal('Gordon Freeman');
                result.hasTarget.uri.should.equal('http://example.com/uri');
                result.hasBody.uri.should.equal('http://example.com/another/uri');
                done();
            });
        });
    });
    describe("- Test delete of an annotation", function(){
        it("- should throw error if no persona token supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var deleteAnnotation = function(){
                return babelClient.deleteAnnotation(null, null, function(err, result){});
            };

            deleteAnnotation.should.throw("Missing Persona token");
        });
        it("- should return an error if no _id supplied", function(){
            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var deleteAnnotation = function(){
                return babelClient.deleteAnnotation('token', null, function(err, result){});
            };

            deleteAnnotation.should.throw("Missing annotationId");
        });
        it("- should return an error if call to request returns an error", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });
            var requestStub = {
                delete:function(options, callback){
                    var error = new Error('Error communicating with Babel');
                    callback(error);
                }
            };

            babel.__set__("request", requestStub);

            babelClient.deleteAnnotation('secret', 'testid', function(err, result){
                (err === null).should.be.false;
                err.message.should.equal('Error communicating with Babel');
                (typeof result).should.equal('undefined');
                done();
            });
        });
        it("- should return an error if call to babel returns an error", function(done){
            var babel = rewire("../../index.js");

            var babelClient = babel.createClient({
                babel_host:"http://babel",
                babel_port:3000
            });

            var requestMock = {};

            var babelErr = {
                error: 'not_found',
                error_description: 'Could not find annotation'
            };

            requestMock.delete = function(options, callback){
                callback(null, {}, babelErr);
            };

            babel.__set__("request", requestMock);

            babelClient.deleteAnnotation('secret', 'testid', function(err, result){
                (err === null).should.be.false;
                err.message.should.equal('Error deleting annotation: ' + JSON.stringify(babelErr));
                (typeof result).should.equal('undefined');
                done();
            });
        });
    });
    describe("- Test formulation of baseURL", function(){
        it("- should return baseURL with port included when not implicit", function(){
            var config = {
                babel_host: "http://babel",
                babel_port: 3000
            };

            var babelClient = babel.createClient(config);

            babelClient._getBaseURL().should.equal(config.babel_host + ':' + config.babel_port);
        });
        it("- should return baseURL without port included when implicit - http", function(){
            var config = {
                babel_host: "http://babel",
                babel_port: 80
            };

            var babelClient = babel.createClient(config);

            babelClient._getBaseURL().should.equal(config.babel_host);
        });
        it("- should return baseURL without port included when implicit - https", function(){
            var config = {
                babel_host: "https://babel",
                babel_port: 443
            };

            var babelClient = babel.createClient(config);

            babelClient._getBaseURL().should.equal(config.babel_host);
        });
    });
});
