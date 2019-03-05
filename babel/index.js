'use strict';

var _ = require('lodash'),
    request = require('request'),
    md5 = require('MD5'),
    querystring = require('querystring');

// log severities
var DEBUG = "debug";
var ERROR = "error";

/**
 * Create a babel client
 *
 * @param {object} config Babel Client config
 * @param {string} config.babel_host Babel host (must start with http or https)
 * @param {string} config.babel_port Babel port
 * @constructor
 */
var BabelClient = function babelClient(config) {

    this.config = config || {};

    var requiredParams = ['babel_host', 'babel_port'];

    for(var i in requiredParams){
        if (this.config[requiredParams[i]] === undefined) {
            throw new Error("Missing Babel config: "+requiredParams[i]);
        }
    }

    if(!this.config.babel_host.match('^http')){
        throw new Error('Invalid Babel config: babel_host');
    }

    this.config.babel_hostname = this.config.babel_host.split('://', 2)[1];
};

/**
 * Make a HEAD request to check for new annotations
 * @param {string} target
 * @param {string} token
 * @param {object} params
 * @param {string} params.delta_token Using a delta_token tells you if there have been new annotations since another one
 * @callback callback
 * @throws Error
 */
BabelClient.prototype.headTargetFeed = function headTargetFeed(target, token, params, callback){

    if(!target){
        throw new Error('Missing target');
    }
    if(!token){
        throw new Error('Missing Persona token');
    }

    // params are optional
    if(typeof params === "function"){
        callback = params;
        params = {};
    }

    // Build up a query string
    var queryString = this._queryStringParams(params);

    var requestOptions = {
        method: "HEAD",
        url: this._getBaseURL() +
          '/feeds/targets/'+md5(target)+'/activity/annotations' + (!_.isEmpty(queryString) ? '?'+queryString : ''),
        headers: {
            'Accept': 'application/json',
            'Authorization':'Bearer '+token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request(requestOptions, function requestResponse(err, response){
        if(err){
            callback(err);
        } else if(response.statusCode && response.statusCode !== 204){
            var babelError = new Error();
            babelError.http_code = response.statusCode || 404;
            callback(babelError);
        } else{
            callback(null, response);
        }
    });
};

/**
 * Get a feed based off a target identifier. Return either a list of feed identifiers, or hydrate it and
 * pass back the data as well
 *
 * @param {string} target Feed target identifier
 * @param {string} token Persona token
 * @param {boolean} hydrate Gets a fully hydrated feed, i.e. actually contains the posts
 * @param {object} params Query params to pass into the call to Babel
 * @callback callback
 * @throws Error
 */
BabelClient.prototype.getTargetFeed = function getTargetFeed(target, token, hydrate, params, callback){

    if(!target){
        throw new Error('Missing target');
    }
    if(!token){
        throw new Error('Missing Persona token');
    }

    // params are optional
    if(typeof params === "function"){
        callback = params;
        params = {};
    }

    var self = this;

    hydrate = hydrate || false;

    // Build up a query string
    var queryString = this._queryStringParams(params);

    var requestOptions = {
        url: this._getBaseURL() +
          '/feeds/targets/'+md5(target)+'/activity/annotations'+((hydrate === true) ? '/hydrate' : '') + (!_.isEmpty(queryString) ? '?'+queryString : ''),
        headers: {
            'Accept': 'application/json',
            'Authorization':'Bearer '+token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request(requestOptions, function requestResponse(err, response, body){
        if(err){
            callback(err);
        } else{
            self._parseJSON(response, body, callback);
        }
    });
};

/***
 * Queries multiple feeds.
 * Given an array of feed ids it will return a merged hydrated feed.
 * @param {array} feeds an array of Feed Identifiers
 * @param {string} token Persona token
 * @param callback
 */
BabelClient.prototype.getFeeds = function getFeeds(feeds, token, callback) {
    if (!feeds) {
        throw new Error('Missing feeds');
    }
    if (!_.isArray(feeds) || _.isEmpty(feeds)) {
        throw new Error("Feeds should be an array and must not be empty");
    }
    if (!token) {
        throw new Error('Missing Persona token');
    }

    var self = this;

    feeds = feeds.join(",");

    var requestOptions = {
        url: this._getBaseURL() + '/feeds/annotations/hydrate?feed_ids=' + encodeURIComponent(feeds),
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request(requestOptions, function requesResponse(err, response, body) {
        if (err) {
            callback(err);
        } else {
            self._parseJSON(response, body, callback);
        }
    });
};

/**
 * Get a single annotation identified by the id parameter.
 *
 * @param {string} token Persona token
 * @param {string} id annotation ID
 * @callback callback
 */
BabelClient.prototype.getAnnotation = function getAnnotation(token, id, callback) {
    if(!token){
        throw new Error('Missing Persona token');
    }

    if(!id) {
        throw new Error('Missing annotation ID');
    }

    var self = this;

    var requestOptions = {
        url: this._getBaseURL() + '/annotations/'+id,
        headers: {
            'Accept': 'application/json',
            'Authorization':'Bearer '+token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request(requestOptions, function requestResponse(err, response, body){
        if(err){
            callback(err);
        } else{
            self._parseJSON(response, body, callback);
        }
    });
};

/**
 * Get annotations feed based off options passed in
 *
 * @param {string} token Persona token
 * @param {object} querystringMap Options that can be used to query an annotations feed
 * @param {string} querystringMap.hasTarget.uri Restrict to a specific target
 * @param {string} querystringMap.annotatedBy Restrict to annotations made by a specific user
 * @param {string} querystringMap.hasBody.uri Restrict to a specific body uri
 * @param {string} querystringMap.hasBody.type Restrict to annotations by the type of the body
 * @param {string} querystringMap.q Perform a text search on hasBody.char field. If used, annotatedBy and hasTarget will be ignored
 * @param {string} querystringMap.limit Limit returned results
 * @param {string} querystringMap.offset Offset start of results
 * @callback callback
 */
BabelClient.prototype.getAnnotations = function getAnnotations(token, querystringMap, callback){

    if(!token){
        throw new Error('Missing Persona token');
    }

    var self = this;

    querystringMap = querystringMap || {};

    var requestOptions = {
        url: this._getBaseURL() + '/annotations?' + querystring.stringify(querystringMap),
        headers: {
            'Accept': 'application/json',
            'Authorization':'Bearer '+token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request(requestOptions, function requestResponse(err, response, body){
        if(err){
            callback(err);
        } else{
            self._parseJSON(response, body, callback);
        }
    });

};

/**
 * Create an annotation
 *
 * @param {string} token Persona token
 * @param {object} data Data that can be passed into an annotation
 * @param {object} data.hasbody
 * @param {string} data.hasBody.format
 * @param {string} data.hasBody.type
 * @param {string} data.hasBody.chars
 * @param {object} data.hasBody.details
 * @param {string} data.hasBody.uri
 * @param {string} data.hasBody.asReferencedBy
 * @param {object} data.hasTarget
 * @param {string} data.hasTarget.uri
 * @param {string} data.hasTarget.fragment
 * @param {string} data.hasTarget.asReferencedBy
 * @param {string} data.annotatedBy
 * @param {string} data.motiviatedBy
 * @param {string} data.annotatedAt
 * @param {object} options that control the request being made to babel.
 * @param {boolean} options.headers['X-Ingest-Synchronously']
 * @param callback
 */
BabelClient.prototype.createAnnotation = function createAnnotation(token, data, options, callback){

    if(_.isUndefined(callback) && _.isFunction(options)){
        callback = options;
        options = null;
    }

    if(!token){
        throw new Error('Missing Persona token');
    }
    if(!data.hasBody){
        throw new Error('Missing data: hasBody');
    }
    if(!data.hasBody.format){
        throw new Error('Missing data: hasBody.format');
    }
    if(!data.hasBody.type){
        throw new Error('Missing data: hasBody.type');
    }
    if(!data.annotatedBy){
        throw new Error('Missing data: annotatedBy');
    }
    if(!data.hasTarget){
        throw new Error('Missing data: hasTarget');
    }

    // validate the hasTarget property
    var targets = [];
    if (_.isArray(data.hasTarget)) {
        targets = data.hasTarget;
        if (targets.length===0) {
            throw new Error("Missing data: hasTarget cannot be empty array");
        }
    } else {
        targets.push(data.hasTarget);
    }
    _.map(targets, function mapTargets(target) {
        if (!_.has(target,"uri")) {
            throw new Error("Missing data: hasTarget.uri is required");
        }
        for (var prop in target) {
            if(target.hasOwnProperty(prop)){
                if (!(prop==="uri" || prop==="fragment" || prop==="asReferencedBy" )) {
                    throw new Error("Invalid data: hasTarget has unrecognised property '"+prop+"'");
                }
            }
        }
    });

    var requestOptions = {
        method:'POST',
        body:data,
        json:true,
        url: this._getBaseURL() + '/annotations',
        headers: {
            'Accept': 'application/json',
            'Authorization':'Bearer '+token,
            'Host': this.config.babel_hostname
        }
    };

    // if options.xIngestSynchronously set to true, then and only then add the header
    // otherwise leave it out which defaults to false
    if( options && _.has(options, 'headers') && _.has(options.headers,'X-Ingest-Synchronously') && options.headers['X-Ingest-Synchronously'] === true ) {
        requestOptions.headers['X-Ingest-Synchronously'] = 'true';
    }

    this.debug(JSON.stringify(requestOptions));

    request.post(requestOptions, function requestResponse(err, response, body){
        if(err){
            callback(err);
        } else{
            if(!this._responseSuccessful(response) || (body.message && body.errors)){
                var babelError = new Error(body.message);
                babelError.http_code = response.statusCode || 404;
                callback(babelError);
            } else{
                callback(null, body);
            }
        }
    }.bind(this));
};

/**
 * Update an annotation
 *
 * @param {string} token Persona token
 * @param {object} data Data that can be passed into an annotation
 * @param {object} data._id
 * @param {object} data.hasbody
 * @param {string} data.hasBody.format
 * @param {string} data.hasBody.type
 * @param {string} data.hasBody.chars
 * @param {object} data.hasBody.details
 * @param {string} data.hasBody.uri
 * @param {string} data.hasBody.asReferencedBy
 * @param {object} data.hasTarget
 * @param {string} data.hasTarget.uri
 * @param {string} data.hasTarget.fragment
 * @param {string} data.hasTarget.asReferencedBy
 * @param {string} data.annotatedBy
 * @param {string} data.motiviatedBy
 * @param {string} data.annotatedAt
 * @param callback
 */
BabelClient.prototype.updateAnnotation = function updateAnnotation(token, data, callback){
    if (!token) {
        throw new Error('Missing Persona token');
    }
    if (!data._id) {
        throw new Error('Missing data: _id');
    }
    if (!data.hasBody) {
        throw new Error('Missing data: hasBody');
    }
    if (!data.hasBody.format) {
        throw new Error('Missing data: hasBody.format');
    }
    if (!data.hasBody.type) {
        throw new Error('Missing data: hasBody.type');
    }
    if (!data.annotatedBy) {
        throw new Error('Missing data: annotatedBy');
    }
    if (!data.hasTarget) {
        throw new Error('Missing data: hasTarget');
    }

    // validate the hasTarget property
    var targets = [];
    if (_.isArray(data.hasTarget)) {
        targets = data.hasTarget;
        if (targets.length === 0) {
            throw new Error('Missing data: hasTarget cannot be empty array');
        }
    } else {
        targets.push(data.hasTarget);
    }
    _.map(targets, function mapTargets(target) {
        if (!_.has(target, 'uri')) {
            throw new Error('Missing data: hasTarget.uri is required');
        }
        for (var prop in target) {
            if(target.hasOwnProperty(prop)){
                if (!(prop === 'uri' || prop === 'fragment' || prop === 'asReferencedBy' )) {
                    throw new Error('Invalid data: hasTarget has unrecognised property \'' + prop + '\'');
                }
            }
        }
    });

    var requestOptions = {
        method: 'PUT',
        body: data,
        json: true,
        url: this._getBaseURL() + '/annotations/' + data._id,
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request.put(requestOptions, function requestResponse(err, response, body){
        if (err) {
            callback(err);
        } else {
            if(!this._responseSuccessful(response) || (body.message && body.errors)){
                var babelError = new Error(body.message);
                babelError.http_code = response.statusCode || 404;
                callback(babelError);
            } else {
                callback(null, body);
            }
        }
    }.bind(this));
};

/**
 * Delete an annotation by its id
 *
 * @param {string} token Persona token
 * @param {object} annotationId Annotation id to delete
 * @param callback
 */
BabelClient.prototype.deleteAnnotation = function deleteAnnotation(token, annotationId, callback){
    if (!token) {
        throw new Error('Missing Persona token');
    }
    if (!annotationId) {
        throw new Error('Missing annotationId');
    }

    var requestOptions = {
        method: 'DELETE',
        json: true,
        url: this._getBaseURL() + '/annotations/' + annotationId,
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Host': this.config.babel_hostname
        }
    };

    this.debug(JSON.stringify(requestOptions));

    request.delete(requestOptions, function requestResponse(err, response, body){
        if (err) {
            callback(err);
        } else {
            if (response.statusCode !== 204){
                var babelError = new Error('Error deleting annotation: ' + JSON.stringify(body));
                babelError.http_code = response.statusCode;
                callback(babelError);
            } else {
                callback(null, null);
            }
        }
    });
};

/**
 * Get the base URL for connecting to Babel
 * @return {string} URL to connect to
 */
BabelClient.prototype._getBaseURL = function getBaseURL() {
    // check to see if the port should be implicit based on the protocol
    // if it is, don't bother specifying it on the connection string
    var implicitPort = _.startsWith(this.config.babel_host, 'https:') &&
        this.config.babel_port === 443 || _.startsWith(this.config.babel_host, 'http:') &&
        this.config.babel_port === 80;

    return this.config.babel_host + (implicitPort ? '' : ':' + this.config.babel_port);
};

/**
 * Build up a query string
 * @param {object} params
 * @returns {string}
 * @private
 */
BabelClient.prototype._queryStringParams = function queryStringParams(params){
    var queryString = '',
        queryStringParams = [];

    if(!_.isEmpty(params)){
        for(var param in params){
            if(params.hasOwnProperty(param)){
               queryStringParams.push(encodeURIComponent(param)+'='+encodeURIComponent(params[param]));
            }
        }
        queryString += queryStringParams.join('&');
    }
    return queryString;
};

/**
 * Parse JSON safely
 * @param {object} response
 * @param {object} body
 * @callback callback
 * @private
 */
BabelClient.prototype._parseJSON = function parseJSON(response, body, callback){
    try{
        var jsonBody = JSON.parse(body);

        if(jsonBody.error){
            var babelError = new Error(jsonBody.error_description);
            babelError.http_code = response.statusCode || 404;
            callback(babelError);
        } else{
            callback(null, jsonBody);
        }
    } catch(e){
        var babelError = new Error("Error parsing JSON: "+body);
        callback(babelError);
    }
};

/**
 * Log wrapping functions
 *
 * @param severity ( debug or error )
 * @param message
 * @returns {boolean}
 * @private
 */
BabelClient.prototype._log = function log(severity, message) {
    if (!this.config.enable_debug) {
        return true;
    }

    if (this.config.logger) {
        if (severity === DEBUG) {
            this.config.logger.debug("[babel_node_client] " + message);
        } else if (severity === ERROR) {
            this.config.logger.error("[babel_node_client] " + message);
        } else {
            console.log(severity + ": [babel_node_client] " + message);
        }
    } else {
        console.log(severity + ": [babel_node_client] " + message);
    }
};

BabelClient.prototype.debug = function debug(message) {
    this._log(DEBUG, message);
};
BabelClient.prototype.error = function error(message) {
    this._log(ERROR, message);
};

BabelClient.prototype._responseSuccessful = function responseSuccessful(response) {
    if (response && response.statusCode) {
        if (response.statusCode >= 200 && response.statusCode <= 299) {
            return true;
        }
    }
    return false;
};

/**
 * The only way to get an instance of the Babel Client is through this method
 * @param config
 * @returns {NodeClient}
 */
exports.createClient = function createClient(config) {
    return new BabelClient(config);
};
