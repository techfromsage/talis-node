var should = require('should');
var assert = require('assert');
var babel = require('../../index.js');
var sinon = require('sinon');
const fs = require('fs');

describe("Babel Node Client Smoke Test Against Local Echo", function(){
  // Create a token by running the following command in the project root:
  //   persona-token local > persona-token.txt
  var token = fs.readFileSync('persona-token.txt', 'utf8').trim();

  var babelClient = babel.createClient({
    babel_host:"http://babel.talis.local",
    babel_port:80
  });

  it.skip("should head taget feed", function(done){
    var target = "/modules/5d4daff5b34543fb61c7e761/resources/5f11e001dfb00d6aa4dd5153";

    var params = {
      delta_token: 1,
    };

    babelClient.headTargetFeed(target, token, params, function(err, response){
      console.log('err:', err);
      console.log('response:', response);
      (err === null).should.be.true;
      response.headers.should.have.property('x-feed-new-items', '1');
      done();
    });
  });
  it("should get entire target feed", function(done){
    done();
  });
  it("should get target feed", function(done){
    done();
  });
  it("should get feeds", function(done){
    done();
  });

  it("should get annotations", async function(){
    var annotation = {"hasBody":{"type":"Text","format":"text/plain","chars":"Some annotation"},"hasTarget":{"uri":"http://target/1234567890"},"annotatedBy":"1234567890","motivatedBy":"commenting"};

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

  it("should create, update and delete annotation", async function(){
    var annotation = {"hasBody":{"type":"Text","format":"text/plain","chars":"Some annotation"},"hasTarget":{"uri":"http://target/1234567890"},"annotatedBy":"1234567890","motivatedBy":"commenting"};

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

    var updatedAnnotation = {"_id":createResult._id, "hasBody":{"type":"Text","format":"text/plain","chars":"Some updated annotation"},"hasTarget":{"uri":"http://target/1234567890"},"annotatedBy":"1234567890","motivatedBy":"updating commenting"};

    var updateResult = await updateAnnotation(token, updatedAnnotation);
    updateResult.hasBody.chars.should.equal("Some updated annotation");
    updateResult.motivatedBy.should.equal("updating commenting");

    await sleep(1000);

    var getTwoResult = await getAnnotation(token, createResult._id);
    getTwoResult.hasBody.chars.should.equal("Some updated annotation");

    var deleteResult = await deleteAnnotation(token, createResult._id);

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

});
