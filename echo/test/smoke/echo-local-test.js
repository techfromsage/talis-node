var should = require('should');
var assert = require('assert');
var echo = require('../../index.js');
var sinon = require('sinon');
const fs = require('fs');

describe("Echo Node Client Smoke Test Against Local Echo", function(){
    it("- should post an event", function(done){
      var echoClient = echo.createClient({
        echo_endpoint: "http://echo.talis.local"
      });

      // Create a token by running the following command in the project root:
      //   persona-token local > persona-token.txt
      var token = fs.readFileSync('persona-token.txt', 'utf8').trim();

      var event = {
        class: "class",
        source: "talis-node-smoke-test",
        timestamp: 1324524509,
        props: {
          url: "https://foo.bar/baz.html"
        }
      }

      echoClient.addEvents(token, event, function(err, result){

        (err === null).should.be.true;

        result.code.should.equal(0);
        result.label.should.equal("SUCCESS");
        (typeof result.body).should.equal("undefined");

        done();
      });
    });

    it("- should error when invalid post of event", function(done){
      var echoClient = echo.createClient({
        echo_endpoint: "http://echo.talis.local"
      });

      // Create a token by running the following command in the project root:
      //   persona-token local > persona-token.txt
      var token = fs.readFileSync('persona-token.txt', 'utf8').trim();

      var event = {
        class_missing_from_post: "class",
        source: "talis-node-smoke-test",
        timestamp: 1324524509,
        props: {
          url: "https://foo.bar/baz.html"
        }
      }

      var addEvents = function(){
        return echoClient.addEvents(token, event, function(err, result){});
      };
      
      addEvents.should.throw("Missing field data.class");

      done();
    });

    it("- should error when query analytics with invalid params", function(done){
      var echoClient = echo.createClient({
        echo_endpoint: "http://echo.talis.local"
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

      // Create a token by running the following command in the project root:
      //   persona-token local > persona-token.txt
      var token = fs.readFileSync('persona-token.txt', 'utf8').trim();

      echoClient.queryAnalytics(token, 'sum', params, false, function(err, result){

        (err === null).should.be.false;

        err.code.should.equal(2);
        err.label.should.equal("INVALID_QUERY");
        (typeof err.body).should.equal("undefined");

        done();
      });

    });

    it('- should not throw an error if valid query parameters supplied', function(done){
      var echoClient = echo.createClient({
        echo_endpoint: "http://echo.talis.local"
      });

      var params = {
        "class": "player.timer",
        "group_by": "user,index",
        "property": "interval",
        "key": "resource_id",
        "value": "YOUR_RESOURCE_ID_HERE",
      };

      // Create a token by running the following command in the project root:
      //   persona-token local > persona-token.txt
      var token = fs.readFileSync('persona-token.txt', 'utf8').trim();

      echoClient.queryAnalytics(token, 'sum', params, false, function(err, result){

        (err === null).should.be.true;

        result.code.should.equal(0);
        result.label.should.equal("SUCCESS");

        (typeof result.body).should.equal("object");
        result.body.head.type.should.equal("sum");
        result.body.head.class.should.equal("player.timer");
        result.body.head.key.should.equal("resource_id");
        result.body.head.value.should.equal("YOUR_RESOURCE_ID_HERE");
        result.body.head.count.should.equal(0);

        done();
      });
    });
});
