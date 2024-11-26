var should = require('should');
var assert = require('assert');
var echo = require('../../index.js');
var sinon = require('sinon');
const fs = require('fs');

describe("Echo Node Client Smoke Test Against Local Echo", function(){
  //   Run these smoke tests setting the PERSONA_TOKEN environment variable 
  //     PERSONA_TOKEN=$(persona-token local) npm run echo-smoke-test
  var token = process.env.PERSONA_TOKEN;

  var echoClient = echo.createClient({
    echo_endpoint: "http://echo.talis.local"
  });

  it("- should post an event", async function(){
    var event = {
      class: "class",
      source: "talis-node-smoke-test",
      timestamp: 1324524509,
      props: {
        url: "https://foo.bar/baz.html"
      }
    }

    var result = await addEvents(token, event);
    result.code.should.equal(0);
    result.label.should.equal("SUCCESS");
  });

  it("- should error when invalid post of event", async function(){
    var badEvent = {
      class_missing_from_post: "class",
      source: "talis-node-smoke-test",
      timestamp: 1324524509,
      props: {
        url: "https://foo.bar/baz.html"
      }
    }

    try {
      echoClient.addEvents(token, badEvent, function(){});
      fail();
    } catch (err) {
      err.message.should.equal("Missing field data.class");
    }
  });

  it("- should error when query analytics with invalid params", async function(){
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

    try {
      await queryAnalytics(token, 'sum', params, false);
      fail();
    } catch (err) {
      err.code.should.equal(2);
      err.label.should.equal("INVALID_QUERY");
    }
  });

  it('- should not throw an error if valid query parameters supplied', async function(){
    var params = {
      "class": "player.timer",
      "group_by": "user,index",
      "property": "interval",
      "key": "resource_id",
      "value": "YOUR_RESOURCE_ID_HERE",
    };

    var result = await queryAnalytics(token, 'sum', params, false);


    result.code.should.equal(0);
    result.label.should.equal("SUCCESS");

    (typeof result.body).should.equal("object");
    result.body.head.type.should.equal("sum");
    result.body.head.class.should.equal("player.timer");
    result.body.head.key.should.equal("resource_id");
    result.body.head.value.should.equal("YOUR_RESOURCE_ID_HERE");
    result.body.head.count.should.equal(0);
  });

  function addEvents(token, event){
    return new Promise((resolve, reject) => {
      echoClient.addEvents(token, event, function(err, result){
        if(err){
          reject(err);
        }
        resolve(result);
      });
    });
  }

  function queryAnalytics(token, type, params, debug){
    return new Promise((resolve, reject) => {
      echoClient.queryAnalytics(token, type, params, debug, function(err, result){
        if(err){
          reject(err);
        }
        resolve(result);
      });
    });
  }
});
