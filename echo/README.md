Node Client for Echo
==============

![Build status](https://travis-ci.org/talis/echo-node-client.svg?branch=master)
[![Dependency Status](https://dependencyci.com/github/talis/echo-node-client/badge)](https://dependencyci.com/github/talis/echo-node-client)

## Getting Started
Install the module:

```npm install git://github.com/talis/echo-node-client.git#0.1.0 --save```

Create an echo client as follows:

```javascript
var echo = require('echo-node-client');
var echoClient = echo.createClient({
    echo_endpoint:'http://echo:3002',
    enable_debug:true
});
```

## Documentation

To use any of the Echo client functions, you must have a Persona token. Read the [Persona docs](http://docs.talispersona.apiary.io/), or try
out the [Persona node client](https://github.com/talis/persona-node-client). You might also want to look at the [Echo docs](http://docs.talisecho.apiary.io/) too.

### Add an event
Send events / an event to Echo

```javascript
var token = req.personaClient.getToken(req);
echoClient.addEvents(token, {
    user:'123',
    timestamp:new Date(),
    class:'page.views',
    source:'production.myapp.web',
    props:{
        url:'http://example.com'
    }
}, function(err){
    if(err){
        // Handle errors here...
    } else{
        // Do some other stuff here...
    }
});
```

### Query analytics
For constructing graphs or other representations of analytics, use ```queryAnalytics```

```queryAnalytics = function(token, queryOperator, queryParams, useCache, callback)```

```queryOperator``` can be: hits, average, sum, max or funnel
```queryParams``` can be any parameters needed to support the query, selected from possible options such as:

- class
- source
- property
- interval
- group_by
- key
- value
- from
- to
- percentile
- user
- filter
- n

Example:

```javascript
var token = req.personaClient.getToken(req);

var queryParams = {
    class: 'player.timer.2',
    to: dateTo,
    from: dateFrom,
    'n.index': '0:1:3',
    group_by: 'n.index',
    property: 'interval_with_decay',
    'filter.module_id': module_id,
    'filter.resource_id': resource_id,
    'user.include': user_id
};

echoClient.queryAnalytics(token, 'sum', queryParams, true, function (echoErr, echoData) {
    if (err){
        // Handle errors here...
    } else{
        // Do some other stuff here...
    }    
}
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

0.1.0 - Initial release
0.2.0 - Added queryAnalytics method

## License
Copyright (c) 2015 Talis Education Limited.
