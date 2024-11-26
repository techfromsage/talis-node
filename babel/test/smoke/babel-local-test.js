var should = require('should');
var assert = require('assert');
var babel = require('../../index.js');
var sinon = require('sinon');
const fs = require('fs');

describe("Babel Node Client Smoke Test Against Local Babel", function(){
  //   Run these smoke tests setting the PERSONA_TOKEN environment variable 
  //     PERSONA_TOKEN=$(persona-token local) npm run echo-smoke-test
  var token = process.env.PERSONA_TOKEN;

  var babelClient = babel.createClient({
    babel_host:"http://babel.talis.local",
    babel_port:80
  });

  var annotation = {
    "hasBody": {
      "type": "Text",
      "format": "text/plain",
      "chars": "Some annotation"
    },
    "hasTarget": {
      "uri": "http://target/1234567890"
    },
    "annotatedBy": "1234567890",
    "motivatedBy": "commenting",
  };

  it("should head taget feed", async function(){
    var target = "http://target/1234567890";
    var getFeedResult = await getTargetFeed(target, token, true, {limit: 1});
    var params = {
      delta_token: getFeedResult.delta_token,
    };

    var response = await headTargetFeed(target, token, params);

    response.headers.should.have.property('x-feed-new-items');
  });

  it("should get entire target feed", async function(){
    var target = "http://target/1234567890";
    var result = await getEntireTargetFeed(target, token, true, {limit: 1});

    result.should.have.property('feed_length');
    result.should.have.property('annotations');
  });

  it("should get target feed", async function(){
    var target = "http://target/1234567890";
    var result = await getTargetFeed(target, token, true, {limit: 1});

    result.should.have.property('feed_length');
    result.should.have.property('annotations');
    result.annotations[0].should.have.property('annotatedBy', '1234567890');
  });

  it("should get feeds", async function(){
    var result = await getFeeds(['users:1234567890:activity'], token);

    result.feeds[0].should.have.property('feed_id', 'users:1234567890:activity');
    result.feeds[0].should.have.property('status', 'success');
  });

  it("should get annotation", async function(){
    var createResult = await createAnnotation(token, annotation);
    await sleep(1000);
    var getResult = await getAnnotation(token, createResult._id);

    getResult.hasBody.type.should.equal("Text");
    getResult.hasBody.format.should.equal("text/plain");
    getResult.hasBody.chars.should.equal("Some annotation");
    getResult.hasTarget.uri.should.equal("http://target/1234567890");
    getResult.annotatedBy.should.equal("1234567890");
    getResult.motivatedBy.should.equal("commenting");
  });

  it("should get annotatioins", async function(){
    var createResult = await createAnnotation(token, annotation);
    await sleep(1000);
    var getResult = await getAnnotations(token, {});

    getResult.limit.should.equal(25);
    getResult.offset.should.equal(0);
    getResult.annotations.should.have.lengthOf(25);
  });

  it("should create, update and delete annotation", async function(){

    var createResult = await createAnnotation(token, annotation);

    createResult.hasBody.type.should.equal("Text");
    createResult.hasBody.format.should.equal("text/plain");
    createResult.hasBody.chars.should.equal("Some annotation");
    createResult.hasTarget.uri.should.equal("http://target/1234567890");
    createResult.annotatedBy.should.equal("1234567890");
    createResult.motivatedBy.should.equal("commenting");

    await sleep(1000);

    var getOneResult = await getAnnotation(token, createResult._id);
    getOneResult.hasBody.chars.should.equal("Some annotation");

    var updatedAnnotation = annotation;
    updatedAnnotation._id = createResult._id;
    updatedAnnotation.hasBody.chars = "Some updated annotation";
    updatedAnnotation.motivatedBy = "updating commenting";

    var updateResult = await updateAnnotation(token, updatedAnnotation);
    updateResult.hasBody.chars.should.equal("Some updated annotation");
    updateResult.motivatedBy.should.equal("updating commenting");

    await sleep(1000);

    var getTwoResult = await getAnnotation(token, createResult._id);
    getTwoResult.hasBody.chars.should.equal("Some updated annotation");

    await deleteAnnotation(token, createResult._id);

    await sleep(1000);

    var runGetAnnoation = async function(){
      await getAnnotation(token, createResult._id);
    };

    try {
      await runGetAnnoation()
      fail();
    } catch (err) {
      err.message.should.equal("Could not find annotation");
    }
  });

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function createAnnotation(token, annotation){
    return new Promise((resolve, reject) => {
      babelClient.createAnnotation(token, annotation, {}, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function getAnnotation(token, id){
    return new Promise((resolve, reject) => {
      babelClient.getAnnotation(token, id, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function getAnnotations(token, queryStringMap){
    return new Promise((resolve, reject) => {
      babelClient.getAnnotations(token, queryStringMap, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function updateAnnotation(token, annotation){
    return new Promise((resolve, reject) => {
      babelClient.updateAnnotation(token, annotation, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function deleteAnnotation(token, id){
    return new Promise((resolve, reject) => {
      babelClient.deleteAnnotation(token, id, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function getFeeds(feeds, token){
    return new Promise((resolve, reject) => {
      babelClient.getFeeds(feeds,token,function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function getTargetFeed(target, token, hydrate, params){
    return new Promise((resolve, reject) => {
      babelClient.getTargetFeed(target, token, hydrate, params, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }
 
  function getEntireTargetFeed(target, token, hydrate){
    return new Promise((resolve, reject) => {
      babelClient.getEntireTargetFeed(target, token, hydrate, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }

  function headTargetFeed(target, token, params){
    return new Promise((resolve, reject) => {
      babelClient.headTargetFeed(target, token, params, function(err, result){
        if(err){
          reject(err);
        }else{
          resolve(result);
        }
      });
    });
  }
});
