'use strict';

var request = require('request');
var _ = require('lodash');
var errorCodes = require("./lib/error-codes").errorCodes;
var httpStatusToErrorCode = require("./lib/error-codes").httpStatusToErrorCode;

// log severities
var DEBUG = 'debug';
var ERROR = 'error';

var validParameters = [
  'class',
  'source',
  'property',
  'interval',
  'group_by',
  'key',
  'value',
  'from',
  'to',
  'percentile',
  'user',
  'filter',
  'n'
];


function isValidParameter(parameter) {
  var hasDot = parameter.indexOf('.');
  var key = hasDot > -1
    ? parameter.substring(0, hasDot)
    : parameter;

  return validParameters.indexOf(key) > -1;
}

/**
 * Build up a query string
 * @param {object} params
 * @returns {string}
 * @private
 */
function queryStringParams(params) {
  var queryString = '';
  var queryParams = [];
  var paramErrors = [];

  Object.keys(params).forEach(function eachParam(param) {
    if (isValidParameter(param)) {
      queryParams.push(encodeURIComponent(param) + '=' + encodeURIComponent(params[param]));
    } else {
      paramErrors.push([param]);
    }
  });

  if (!_.isEmpty(queryParams)) {
    queryString += queryParams.join('&');
  }

  return { errors: paramErrors, queryString: queryString };
}

function Client() {
  var config = {};

  /**
     * Log wrapping functions
     *
     * @param severity ( debug or error )
     * @param message
     * @returns {boolean}
     * @private
     */
  function log(severity, message, meta) {
    if (!config.enable_debug) {
      return;
    }

    if (config.logger) {
      if (severity === DEBUG) {
        config.logger.debug('[echo_node_client] ' + message, meta);
      } else if (severity === ERROR) {
        config.logger.error('[echo_node_client] ' + message, meta);
      } else {
        console.log(severity + ': [echo_node_client] ' + message, meta);
      }
    } else {
      console.log(severity + ': [echo_node_client] ' + message, meta);
    }
  }

  function debug(message, meta) {
    log(DEBUG, message, meta);
  }

  function error(message, meta) {
    log(ERROR, message, meta);
  }

  /**
 * Parse JSON safely
 * @param {object} body
 * @callback callback
 */
  function parseJSON(body, callback) {
    var jsonBody;
    try {
      jsonBody = JSON.parse(body);
    } catch (e) {
      var errText = 'Error parsing returned JSON';
      error(errText);
      callback(errText);
      return;
    }
    callback(null, jsonBody);
    return;
  }

  /**
     * Create an Echo client
     *
     * @param {object} config Echo Client config
     * @param {string} config.echo_host Echo host
     * @param {string} config.echo_port Echo port
     * @constructor
     */
  function EchoClient(cfg) {
    config = cfg;

    var requiredParams = ['echo_endpoint'];

    Object.keys(requiredParams).forEach(function eachKey(index) {
      var key = requiredParams[index];
      if (config[key] === undefined) {
        throw new Error('Missing Echo config: ' + key);
      }
    });
  }

  /**
     * Add an event or events
     * @param {string} token
     * @param {object} data Event data
     * @param {string} data.class Classify the event
     * @param {string} data.source Event source (usually the app it originates from
     * @param {string} data.timestamp Event timestamp
     * @param {string} data.user User performing the event
     * @param {object} data.props Other properties associated with the event
     * @callback callback
     */
  EchoClient.prototype.addEvents = function addEvents(token, data, callback) {
    if (!token) {
      throw new Error('Missing Persona token');
    }

    if (!data) {
      throw new Error('Missing data');
    }

    // multiple events can be written by posting an array
    // if not an array, check data looks ok
    if (!(data instanceof Array)) {
      if (!data.class) {
        throw new Error('Missing field data.class');
      }
      if (!data.source) {
        throw new Error('Missing field data.source');
      }
    }

    var requestOptions = {
      url: config.echo_endpoint + '/1/events',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: data,
      method: 'POST',
      json: true
    };

    debug('request options', requestOptions);

    request.post(requestOptions, function onResp(err, response, body) {
      if (err) {
        var errorResponse = {
          statusCode: 0,
          message: err.message 
        };
        error(
          '[echoClient] addEvents error', 
          { 
            error: errorResponse.message, statusCode: errorResponse.statusCode, body: body 
          }
        );
        callback(errorResponse);
        return;
      } else if (response && parseInt(response.statusCode / 100) !== 2) {
        var errorResponse = {
          statusCode: response.statusCode,
          message: response.statusMessage
        };
        error(
          '[echoClient] addEvents error', 
          { 
            error: errorResponse.message, statusCode: errorResponse.statusCode, body: body
          }
        );
        callback(errorResponse);
        return;
      } else {
        callback(null, body);
      }
    });
  };

  /**
     * Query analytics using a passed operator and parameters
     * @param  {string}   token             Persona token
     * @param  {string}   queryOperator     Query operator (hits, average, sum, max or funnel)
     * @param  {object}   queryParams       Hash of parameters to add to the query
     * @param  {boolean}  useCache          Indicates if cache should be used or not
     * @callback callback
     */
  EchoClient.prototype.queryAnalytics = function queryAnalytics(
    token,
    queryOperator,
    queryParams,
    useCache,
    callback
  ) {
    if (!token) {
      throw new Error('Missing Persona token');
    }

    if (!queryOperator) {
      throw new Error('Missing Analytics queryOperator');
    }

    var validOperators = ['hits', 'average', 'sum', 'max', 'funnel'];

    if (validOperators.indexOf(queryOperator) === -1) {
      throw new Error('Invalid Analytics queryOperator');
    }

    if (!queryParams) {
      throw new Error('Missing Analytics queryParams');
    }

    var constructQueryStringResponse = queryStringParams(queryParams);

    if (!_.isEmpty(constructQueryStringResponse.errors)) {
      error(
        'One or more invalid analytics queryParams where supplied',
        { err: constructQueryStringResponse.errors.join() }
      );

      throw new Error('Invalid Analytics queryParams');
    }

    var requestOptions = {
      url: config.echo_endpoint + '/1/analytics/' + queryOperator + '?' + constructQueryStringResponse.queryString,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    };

    if (useCache === false) {
      requestOptions.headers['cache-control'] = 'none';
    }

    debug('request options', requestOptions);

    request.get(requestOptions, function onResp(err, response, rawBody) {

      if (err || parseInt(response.statusCode / 100) !== 2) {
        var errorCode;
        if (err) {
          errorCode = errorCodes.REQUEST_ERROR;
        } else {
          errorCode = httpStatusToErrorCode[response.statusCode] === undefined
            ? errorCodes.UNKNOWN_ERROR
            : httpStatusToErrorCode[response.statusCode];
        }
  
        var errorCodeLabel = errorCodes[errorCode];
  
        var errorResponse = {
          code: errorCode,
          label: errorCodeLabel,
          detail: rawBody
        };

        error(
          '[echoClient] queryAnalytics error',
          { 
            code: errorCode,
            label: errorCodeLabel,
            detail: rawBody
          }
        );

        callback(errorResponse);
        return;
      } else {
        parseJSON(rawBody, callback);
      }
    });
  };

  return EchoClient;
}


/**
 * The only way to get an instance of the Echo Client is through this method
 * @param config
 * @returns {EchoClient}
 */
exports.createClient = function createClient(config) {
  var EchoClient = Client();
  return new EchoClient(config);
};
