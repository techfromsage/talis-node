Node Client for Babel
==============

![Build status](https://travis-ci.org/talis/babel-node-client.svg?branch=master)

## Getting Started
Install the module:

```npm install node_client@git://github.com/talis/babel-node-client.git#0.3.4 --save```

Create a babel client as follows:

```javascript
var babel = require('babel_client');
var babelClient = babel.createClient({
    babel_host:"localhost",
    babel_port:3000,
    enable_debug: true
});
```

## Documentation

To use any of the Babel client functions, you must have a Persona token. Read the [Persona docs](http://docs.talispersona.apiary.io/), or try
out the [Persona node client](https://github.com/talis/persona-node-client). You might also want to look at the [Babel docs](http://docs.talisbabel.apiary.io/) too.

### Target Feeds
Make a HEAD request to see if any annotations have been added to a feed
```javascript
var target = 'stay-on-target';
var token = req.personaClient.getToken(req);
babelClient.headTargetFeed(target, token, {delta_token:1}, function(error, response){
    // do stuff
    var newItemsFound = response.headers['x-feed-new-items'];
    // newItemsFound will now show you how many annotations have been added since the annotation with a delta_token equal to 1.
});
```

Get a feed based on a target. Now supports passing through of `offset`, `limit` and `delta_token` in params.
```javascript
var target = 'stay-on-target';
var token = req.personaClient.getToken(req);
var hydrate = true;
var params = {
    delta_token:'123'
};
babelClient.getTargetFeed(target, token, hydrate, params, function(error, results){
    // do stuff
    var annotations = results.annotations;
    var delta_token = results.delta_token;
    // Depending on what you specify 'hydate' to be, annotations will be either an array of annotation IDs, or an
    // array of annotation objects.
});
```

If the token is invalid, the ```error``` object will have an http_code of 401.
If the feed cannot be found in babel, the ```error``` object will have an http_code of 404.

#### Options to use
* hydrate: Populate feed with data


### Annotations
Get a feed of annotations back
```javascript
var token = req.personaClient.getToken(req);
babelClient.getAnnotations(token, {}, function(error, results){
    // do stuff
});
```

If the token is invalid, the ```error``` object will have an http_code of 401.

Create an annotation
```javascript
var token = req.personaClient.getToken(req);
var data = {};
babelClient.createAnnotations(token, data, function(error, results){
    // do stuff
});
```

Update an annotation
```javascript
var token = req.personaClient.getToken(req);
var data = {};
babelClient.updateAnnotation(token, data, function(error, results){
    // do stuff
});
```

Delete an annotation
```javascript
var token = req.personaClient.getToken(req);
var annotionId = _someId_;
babelClient.deleteAnnotation(token, annotationId, function(error, results){
    // do stuff
});
```

### Tests
```bash
$ grunt test
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.3.6 - Adds the missing options to update and delete an annotation

0.3.5 - Add host header

0.3.4 - Adds the ability to fetch an individual annotation

0.3.3 - Adds support for passing in params to a feed. Adds support for making a HEAD request to a feed to see if there are any annotations added.

0.3.2 - Safely parses JSON responses. Fixes #5.

0.3.1 - Fixes
  * Now correctly validates hasTarget property when creating annotations. hasTarget can be a single object or an array of objects.
  * createAnnotations now takes an optional third parameter called 'options'. You can use this to set X-Ingest-Synchronously header. If you leave this out of the call, it assumes the third parameter is the callback.

0.3.0 - Added support for querying multiple feeds at once

0.2.0 - Added ability to create annotations

0.1.0 - Added the ability to request a target feed and annotations

## License
Copyright (c) 2015 Talis Education Limited.
