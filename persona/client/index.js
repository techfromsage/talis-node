var crypto = require("crypto");
var url = require("url");
var querystring = require("querystring");
var _ = require("lodash");
var jwt = require("jsonwebtoken");
var CacheService = require("cache-service");
var uuid = require('uuid');

var clientVer = require('../../package.json').version || 'unknown';

var hashKey = require('./lib/hash-key');
var validateOpts = require('./lib/validate-opts');
var validateScopes = require('./lib/validate-scopes');
var publicKeyStore = require('./lib/public-key-store');

var ERROR_TYPES = require('./lib/error-types');

var API_VERSION_PREFIX = '/3';
var PUBLIC_KEY_CACHE_NAME = "public_key";

// log severities
var DEBUG = "debug";
var ERROR = "error";

var JWT_CONFIG = {
    algorithms: ['RS256'],
};

/**
 * Constructor you must pass in an appId string identifying your app, plus an optional config object with the
 * following properties set:
 *
 * optional params:
 * config.persona_host = string, defaults to "users.talis.com";
 * config.persona_port = string|integer, defaults to 443;
 * config.persona_scheme = string, defaults to "https";
 * config.enable_debug : true|false
 * config.logger: <pass in a logger that has debug() and error() functions>
 * config.cache: { module: <redis|node-cache>, options: <cache-service-options> }
 * config.cert_background_refresh: true|false defaults to true
 * config.cert_timeout_sec: int, defaults to 600
 *
 * deprecated params:
 * config.redis_host
 * config.redis_port
 * config.redis_db
 *
 * This library stores no default configuration of its own. It relies on the application/service
 * it is embedded in to supply this information.
 *
 * @param appUA an identifying user agent string for your app, compatible with user agent formatting
 * as per https://tools.ietf.org/html/rfc7231#section-5.5.3 e.g. 'my-app', 'my-app/0.1',
 * 'my-app/0.1 (Ubuntu/12.04; nodejs/0.10.13)`
 * @param config object containing config
 * @constructor
 */
var PersonaClient = function (appUA, config) {
    if (!_.isString(appUA)) {
        throw new Error("Expected string appId as first parameter");
    }

    // establish config, including defaults
    this.config = config || {};
    if (!_.has(this.config, "cert_timeout_sec")) {
        this.config.cert_timeout_sec = 600;
    } else {
        this.config.cert_timeout_sec = parseInt(this.config.cert_timeout_sec, 10);
        if (_.isNaN(this.config.cert_timeout_sec)) {
            throw new Error("Cert config timeout could not be parsed as integer");
        }
    }

    this.apiVersionPrefix = API_VERSION_PREFIX;

    // now set refresh interval ms to be equal or just under cert timeout sec
    this.pk_auto_refresh_timeout_ms = (this.config.cert_timeout_sec > 10) ? (this.config.cert_timeout_sec - 10) * 1000 : this.config.cert_timeout_sec * 1000;

    this.userAgent = (process && _.has(process, ["version", "env.NODE_ENV"])) ? appUA +
        " talis-node/" + clientVer + " (nodejs/" + process.version + "; NODE_ENV=" +
        process.env.NODE_ENV + ")" : appUA + " talis-node/" + clientVer;

    // default connection config
    _.merge({
        persona_host: "users.talis.com",
        persona_port: 443,
        persona_scheme: "https",
    }, this.config);

    this.config.persona_oauth_route = '/oauth/tokens';

    var CacheServiceModule;
    var cacheOptions = {};
    var log = this.log.bind(this);

    if (this.config.cache) {
        log("debug", "Using cache module " + this.config.cache.module + " with: " + JSON.stringify(this.config.cache));
        CacheServiceModule = require("cache-service-" + this.config.cache.module || "node-cache");
        if (this.config.cache.options) {
            cacheOptions = this.config.cache.options;
        }
    } else if (this.config.redis_host && this.config.redis_port) {
        // Legacy config, set up as redis cache
        log("warn", "Setting cache options via config.redis is deprecated");
        // connect to redis and switch to the configured db
        CacheServiceModule = require("cache-service-redis");
        cacheOptions.redisData = {
            hostname: this.config.redis_host,
            port: this.config.redis_port
        };
    } else {
        log("warn", "No cache settings defined, using default in-memory cache");
        CacheServiceModule = require("cache-service-node-cache");
    }
    var cacheModule = new CacheServiceModule(cacheOptions);
    this.tokenCache = new CacheService({
        verbose: this.config.debug
    }, [cacheModule]);

    var host = this.config.persona_scheme +
        "://" +
        this.config.persona_host +
        ":" +
        this.config.persona_port;

    this.tokenCacheKeyPostfix = hashKey(host);

    // need to instantiate this based on the configured scheme
    this.http = require(this.config.persona_scheme);

    if (this.config.cert_background_refresh !== false) {
        this._getPublicKey(function retrievedCert() {
            this.refreshTimerId = setInterval(function refreshCert() {
                this._getPublicKey(function retrievedPublicKey() {
                    log('debug', 'retrieved public key');
                }, true);
            }.bind(this), this.pk_auto_refresh_timeout_ms);
        }.bind(this), true);
    }

    this.log('debug', "Persona Client Created");
};

PersonaClient.prototype._formatCacheKey = function formatCacheKey(key) {
    return key + '_' + this.tokenCacheKeyPostfix;
};

/**
 * Retrieve Persona's public key that is used to sign the JWTs.
 * @param {callback} cb function(err, publicCert)
 * @param {boolean=} refresh (optional) refresh the public key
 * @private
 */
PersonaClient.prototype._getPublicKey = function getPublicKey(cb, refresh, xRequestId) {
    var cacheKey = this._formatCacheKey(PUBLIC_KEY_CACHE_NAME);

    publicKeyStore.get(this, cacheKey, refresh, xRequestId, cb);
};

/**
 * Validate bearer token locally, via JWT verification.
 * @param {object} opts - Options object, must include token to validate, and optionally scope to
 * validate against, and optional xRequestId to pass through.
 * @callback next - Called with the following arguments:
 * 1st argument: an error string (see errorTypes) if validation failed for any reason otherwise
 * null.
 * 2nd argument: "ok" if validation passed otherwise null.
 * 3rd argument: The decoded JWT or null if there was no/invalid token or there was a problem
 * validating.
 */
PersonaClient.prototype.validateToken = function (opts, next) {
    validateOpts(opts, ['token']);
    var token = opts.token;
    var xRequestId = opts.xRequestId || uuid.v4();
    var scopes = opts.scope && _.isString(opts.scope) ? opts.scope.split(',') : opts.scope;

    if (!next) {
        throw "No callback (next attribute) provided";
    } else if (typeof next !== "function") {
        throw "Parameter 'next' is not a function";
    }

    if (token == null) {
        return next(ERROR_TYPES.INVALID_TOKEN, null);
    }

    var headScopeThenVerify = function headScope(callback, decodedToken) {
        var log = this.log.bind(this);
        var queryParams = '';

        if (Array.isArray(scopes)) {
            queryParams = '?scope=' + scopes.join(',');
        }

        log("debug", "Verifying token against scope " + scopes + " via Persona");

        var options = {
            hostname: this.config.persona_host,
            port: this.config.persona_port,
            path: API_VERSION_PREFIX + this.config.persona_oauth_route + '/' + token + queryParams,
            method: "HEAD",
            headers: {
                'User-Agent': this.userAgent,
                'X-Request-Id': xRequestId
            }
        };

        this.http.request(options, function onSuccess(response) {
            switch (response.statusCode) {
            case 204:
                log("debug", "Verification of token via Persona passed");
                return callback(null, "ok", decodedToken);
            case 401:
                log("debug", "Verification of token via Persona failed");
                return callback(ERROR_TYPES.VALIDATION_FAILURE, null, decodedToken);
            case 403:
                log("debug", "Verification of token via Persona failed with insufficient scope");
                return callback(ERROR_TYPES.INSUFFICIENT_SCOPE, null, decodedToken);
            default:
                log("error", "Error verifying token via Persona: " + response.statusCode);
                return callback(ERROR_TYPES.COMMUNICATION_ISSUE, null, decodedToken);
            }
        }).on("error", function onError(error) {
            log("error", "Verification of token via Persona encountered an unknown error");
            return callback(error, null, decodedToken);
        }).end();
    }.bind(this);

    var verifyToken = function verifyToken(publicKey) {
        var debug = this.debug.bind(this);

        debug("using public certificate: " + publicKey);
        jwt.verify(token, publicKey, JWT_CONFIG, function onVerify(error, decodedToken) {
            if (error) {
                debug("Verifying token locally failed");
                return next(ERROR_TYPES.VALIDATION_FAILURE, null, decodedToken);
            }

            if (scopes && decodedToken.hasOwnProperty("scopeCount")) {
                debug("Token has too many scopes (" + decodedToken.scopeCount + ") to put in payload, asking Persona...");
                return headScopeThenVerify(next, decodedToken);
            }

            if (validateScopes(decodedToken.scopes, scopes)) {
                debug("Verifying token locally passed");
                return next(null, "ok", decodedToken);
            } else {
                debug("Verification of token locally failed with insufficient scope (" + scopes + ")");
                return next(ERROR_TYPES.INSUFFICIENT_SCOPE, null, decodedToken);
            }
        });
    }.bind(this);

    this._getPublicKey(function retrievedPublicKey(err, publicKey) {
        if (err) {
            return next(err, null, null);
        }

        return verifyToken(publicKey);
    }, false, xRequestId);
};

/**
 * Express middleware that can be used to verify a token.
 * @param {Object} request - HTTP request object.
 * @param {Object} response - HTTP response object. If you want to validate against a scope (pre-2.0 behavior), provide it as req.params.scope
 * @callback next - Called with the following arguments:
 * 1st argument: an error string (see errorTypes) if validation failed for any reason otherwise
 * null.
 * 2nd argument: "ok" if validation passed otherwise null.
 * 3rd argument: The decoded JWT or null if there was no/invalid token or there was a problem
 * validating.
 */
PersonaClient.prototype.validateHTTPBearerToken = function validateHTTPBearerToken(request, response, next) {
    var config = {
        token: this._getToken(request),
        scope: request.param('scope'),
        xRequestId: this.getXRequestId(request),
    };

    if (arguments.length > 3) {
        throw new Error('Usage: validateHTTPBearerToken(request, response, next)');
    }

    function callback(error, validationResult, decodedToken) {
        if (!error) {
            next(null, validationResult, decodedToken);
            return;
        }

        switch (error) {
        case ERROR_TYPES.INVALID_TOKEN:
            response.status(401);
            response.json({
                'error': 'no_token',
                'error_description': 'No token supplied',
            });
            break;
        case ERROR_TYPES.VALIDATION_FAILURE:
            response.status(401);
            response.set('Connection', 'close');
            response.json({
                'error': 'invalid_token',
                'error_description': 'The token is invalid or has expired',
            });
            break;
        case ERROR_TYPES.INSUFFICIENT_SCOPE:
            response.status(403);
            response.set('Connection', 'close');
            response.json({
                'error': 'insufficient_scope',
                'error_description': 'The supplied token is missing a required scope',
            });
            break;
        default:
            response.status(500);
            response.set('Connection', 'close');
            response.json({
                'error': 'unexpected_error',
                'error_description': 'Unexpected error occurred',
            });
        }

        next(error, null, decodedToken);
        return;
    }

    try {
        this.validateToken(config, callback);
    } catch (exception) {
        if (exception.name === ERROR_TYPES.INVALID_ARGUMENTS) {
            return callback(ERROR_TYPES.INVALID_TOKEN, null, null);
        }

        return callback(exception.message, null, null);
    }
};

/**
 * List all scopes that belong to the given token
 * @param token JWT token
 * @param cb error and a list of scopes
 */
PersonaClient.prototype.listScopes = function listScopes(token, cb) {
    this._getPublicKey(function retrievedPublicKey(err, publicKey) {
        if (err) {
            cb(err);
            return;
        }

        jwt.verify(token, publicKey, JWT_CONFIG, function onVerify(err, decodedToken) {
            if (err) {
                cb(err);
            } else if (decodedToken.hasOwnProperty('scopeCount')) {
                this._getTokenMeta({
                    token: token
                }, function tokenMetaResp(err, tokenMetadata) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, tokenMetadata.scopes.split(' '));
                    }
                });
            } else if (decodedToken.hasOwnProperty('scopes')) {
                cb(null, decodedToken.scopes);
            } else {
                cb(new Error('scopeCount and scopes missing from token'));
            }
        }.bind(this));
    }.bind(this));
};

/**
 * Retrieve the metadata related to a token
 * @param opts object token, which is mandatory & a optional xRequestId
 * @param cb callback error and object that details the token meta
 */
PersonaClient.prototype._getTokenMeta = function getTokenMeta(opts, cb) {
    validateOpts(opts, {
        'token': _.isString
    });
    var xRequestId = opts.xRequestId || uuid.v4();

    var options = {
        hostname: this.config.persona_host,
        port: this.config.persona_port,
        path: API_VERSION_PREFIX + this.config.persona_oauth_route + '/' + opts.token,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            'X-Request-Id': xRequestId,
        },
    };

    var req = this.http.request(options, function tokenMetaRequest(resp) {
        if (resp.statusCode !== 200) {
            var msg = 'unsuccessful token metadata retrieval: status ' + resp.statusCode;
            this.error(msg);
            cb(new Error(msg));
            return;
        }

        var payload = '';
        resp.on('data', function tokenMetaProgress(chunk) {
            payload += chunk;
        });

        resp.on('end', function tokenMetaEnd() {
            var data;

            try {
                data = JSON.parse(payload);
            } catch (e) {
                cb('Error parsing response from persona: ' + payload);
                return;
            }

            if (data.error) {
                cb(data.error);
            } else {
                cb(null, data);
            }
        }.bind(this));
    }.bind(this));

    req.on('error', function tokenMetaError(e) {
        var msg = 'Token metadata error: ' + e.message;
        this.error(msg);
        cb(new Error(msg), null);
    }.bind(this));

    req.end();
};

/**
 * Extract a token from the request - try the header first, followed by the request params
 * @param req
 * @return {*}
 * @private
 */
PersonaClient.prototype._getToken = function (req) {
    if (req.header("Authorization")) {
        var result = req.header("Authorization").match(/Bearer\s(\S+)/);
        if (result && result.length > 1) {
            return result[1];
        }
    }
    if (req.param('access_token')) {
        return req.param('access_token');
    }
    return null;
};

/**
 * Create a presigned URL
 * @param urlToSign
 * @param secret
 * @param expires
 * @param callback
 * @deprecated since version 3.0.0
 */
PersonaClient.prototype.presignUrl = function (urlToSign, secret, expires, callback) {
    if (!urlToSign) {
        throw new Error("You must provide a URL to sign");
    }
    if (!secret) {
        throw new Error("You must provide a secret with which to sign the url");
    }

    if (!expires) {
        expires = Math.floor(new Date().getTime() / 1000) + 900; // 15 minutes
    }

    var parsedURL = url.parse(urlToSign);
    var parsedQuery = querystring.parse(parsedURL.query);

    if (!parsedQuery.expires) {
        var expParam = urlToSign.indexOf("?") ? "&expires=" + expires : "?expires=" + expires;
        if (urlToSign.indexOf('#') !== -1) {
            urlToSign = urlToSign.replace("#", '' + expParam + '#');
        } else {
            urlToSign += expParam;
        }

        parsedURL = url.parse(urlToSign);
    }

    // generate a hash by re-signing the fullURL we where passed but with the 'signature' parameter removed
    var hash = crypto.createHmac('sha256', secret).update(urlToSign).digest('hex');

    // now insert the hash into the query string
    var signedUrl = parsedURL.protocol + '//' + parsedURL.host + parsedURL.path + '&signature=' + hash + (parsedURL.hash ? parsedURL.hash : '');

    callback(null, signedUrl);
};

/**
 * Validate a presigned URL
 * @param presignedUrl
 * @param secret
 * @param callback
 * @deprecated since version 3.0.0
 */
PersonaClient.prototype.isPresignedUrlValid = function (presignedUrl, secret) {
    if (!presignedUrl) {
        throw new Error("You must provide a URL to validate");
    }
    if (!secret) {
        throw new Error("You must provide a secret with which to validate the url");
    }

    // we need to ensure we have a URL passed over
    var parsedURL = url.parse(presignedUrl);
    var parsedQuery = querystring.parse(parsedURL.query);
    var signature = parsedQuery.signature;
    var expiry = parsedQuery.expires;

    this.debug("Validating presignedUrl: " + presignedUrl + " with secret: " + secret);
    if (signature) {
        // replace the signature im the URL...the original secret will have been created from the full URL WITHOUT the signature (obviously!)
        var presignedUrlMinusSignature = presignedUrl.replace('&signature=' + signature, '');
        this.debug("presignedUrl minus signature: " + presignedUrlMinusSignature);
        // generate a hash by re-signing the fullURL we where passed but with the 'signature' parameter removed
        var hash = crypto.createHmac('sha256', secret).update(presignedUrlMinusSignature).digest('hex');
        this.debug("hash generated for presignedurl: " + hash);

        // check if the hash we created matches the passed signature
        if (hash.toString() === signature) {
            this.debug("generated hash matched signature");
            if (expiry) {
                var epochNow = new Date().getTime() / 1000;
                this.debug("checking expiry: " + expiry + ' against epochNow: ' + epochNow);
                if (expiry < epochNow) {
                    this.debug("failed, presigned url has expired");
                    return false;
                }
            } else {
                this.debug("failed, presigned url has no expiry");
                return false;
            }

            this.debug("presigned url is valid");
            return true;
        } else {
            this.debug("failed, generated hash did not match the signature");
            return false;
        }
    } else {
        this.debug("failed, no signature provided");
        return false;
    }
};

/**
 * Obtain a new token for the given id and secret
 * @param opts array, id and secret are mandatory, xRequestId is optional
 * @param callback
 */
PersonaClient.prototype.obtainToken = function (opts, callback) {
    validateOpts(opts, ["id", "secret"]);
    publicKeyStore.obtainToken(this, opts, callback);
};

/**
 * Request an application authorization (client_id/secret pair) for a user with guid, authing with id and secret.
 * Use title to describe the purpose.
 * @param opts array, mandatory params are guid, title, id, secret; optional params xRequestId
 * @param callback
 */
PersonaClient.prototype.requestAuthorization = function (opts, callback) {
    validateOpts(opts, {
        "guid": _.isString,
        "title": _.isString,
        "id": _.isString,
        "secret": _.isString
    });
    var guid = opts.guid;
    var title = opts.title;
    var id = opts.id;
    var secret = opts.secret;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    _this.obtainToken({
        id: id,
        secret: secret,
        xRequestId: xRequestId
    }, function (err, token) { // todo: push down into person itself. You should be able to request an authorization using basic auth with client id/secret
        if (err) {
            callback("Request authorization failed with error: " + err, null);
        } else {
            var post_data = JSON.stringify({
                    'title': title
                }),
                options = {
                    hostname: _this.config.persona_host,
                    port: _this.config.persona_port,
                    path: API_VERSION_PREFIX + '/oauth/users/' + guid + '/authorizations',
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token.access_token,
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length,
                        'User-Agent': _this.userAgent,
                        'X-Request-Id': xRequestId
                    }
                },
                req = _this.http.request(options, function (resp) {
                    if (resp.statusCode === 200) {
                        var str = '';
                        resp.on("data", function (chunk) {
                            str += chunk;
                        });
                        resp.on("end", function () {
                            var data;
                            try {
                                data = JSON.parse(str);
                            } catch (e) {
                                callback("Error parsing response from persona: " + str, null);
                                return;
                            }
                            if (data.error) {
                                callback(data.error, null);
                            } else if (data.client_id && data.client_secret) {
                                callback(null, data);
                            } else {
                                callback("Could not request authorization", null);
                            }
                        });
                    } else {
                        var err = "Request authorization failed with status code " + resp.statusCode;
                        _this.error(err);
                        callback(err, null);
                    }
                });
            req.on("error", function (e) {
                var err = "OAuth::requestAuthorization problem: " + e.message;
                _this.error(err);
                callback(err, null);
            });
            req.write(post_data);
            req.end();
        }
    });
};

/**
 * Delete the authorization defined by opts.authorizationClientId, using id and secret to auth
 * @param opts array, mandatory keys are authorizationClientId, id and secret; optional xRequestId
 * @param callback
 */
PersonaClient.prototype.deleteAuthorization = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        authorizationClientId: _.isString,
        id: _.isString,
        secret: _.isString
    });
    var guid = opts.guid;
    var authorizationClientId = opts.authorizationClientId;
    var id = opts.id;
    var secret = opts.secret;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    _this.obtainToken({
        id: id,
        secret: secret,
        xRequestId: xRequestId
    }, function (err, token) { // todo: push down into person itself. You should be able to request an authorization using basic auth with client id/secret
        if (err) {
            callback("Request authorization failed with error: " + err);
        } else {
            var path = API_VERSION_PREFIX +
                '/oauth/users/' +
                guid +
                '/authorizations/' +
                authorizationClientId;

            var options = {
                    hostname: _this.config.persona_host,
                    port: _this.config.persona_port,
                    path: path,
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token.access_token,
                        'Content-Type': 'application/json',
                        'Content-Length': 0,
                        'User-Agent': _this.userAgent,
                        'X-Request-Id': xRequestId
                    }
                },
                req = _this.http.request(options, function (resp) {
                    if (resp.statusCode === 204) {
                        callback(null);
                    } else {
                        var err = "Delete authorization failed with status code " + resp.statusCode;
                        _this.error(err);
                        callback(err);
                    }
                });
            req.on("error", function (e) {
                var err = "OAuth::deleteAuthorization problem: " + e.message;
                _this.error(err);
                callback(err);
            });
            req.end();
        }
    });
};

/**
 * Update a users profile
 * @param {object} opts object, madatory: profile, token, guid; optional: xRequestId
 * @param {function} callback
 * @callback callback
 */
PersonaClient.prototype.updateProfile = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        token: _.isString,
        profile: _.isObject
    });
    var guid = opts.guid;
    var profile = opts.profile;
    var token = opts.token;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    // Get a profile
    var profileData = JSON.stringify(profile),
        options = {
            hostname: _this.config.persona_host,
            port: _this.config.persona_port,
            path: API_VERSION_PREFIX + '/users/' + guid + '/profile',
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'User-Agent': _this.userAgent,
                'X-Request-Id': xRequestId
            },
            data: {
                profile: JSON.stringify(profile)
            }
        },
        req = _this.http.request(options, function (resp) {
            if (resp.statusCode === 200) {

                var str = '';
                resp.on("data", function (chunk) {
                    str += chunk;
                });
                resp.on("end", function () {
                    var data;
                    try {
                        data = JSON.parse(str);
                    } catch (e) {
                        callback("Error parsing response from persona: " + str, null);
                        return;
                    }

                    if (data) {
                        if (data.error) {
                            callback(data.error, null);
                        } else if (data) {
                            callback(null, data);
                        }
                    } else {
                        callback("Could not update Profile", null);
                    }
                });
            } else {
                var err = "updateProfile failed with status code " + resp.statusCode;
                _this.error(err);
                callback(err, null);
            }
        });

    req.on("error", function (e) {
        var err = "updateProfile problem: " + e.message;
        _this.error(err);
        callback(err, null);
    });
    req.write(profileData);
    req.end();
};

/**
 * Get a user profile by a GUID
 * @param {object} opts - mandatory guid and token; optional xRequestId
 * @param {function} callback
 * @callback callback
 */
PersonaClient.prototype.getProfileByGuid = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        token: _.isString
    });
    var guid = opts.guid;
    var token = opts.token;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    var guids = _.isArray(guid) ? guid.join(",") : guid;

    // Get a profile
    var options = {
            hostname: _this.config.persona_host,
            port: _this.config.persona_port,
            path: API_VERSION_PREFIX + "/users/" + guids,
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                'User-Agent': _this.userAgent,
                'X-Request-Id': xRequestId
            }
        },
        req = _this.http.request(options, function (resp) {
            if (resp.statusCode === 200) {

                var str = "";
                resp.on("data", function (chunk) {
                    str += chunk;
                });
                resp.on("end", function () {
                    var data;
                    try {
                        data = JSON.parse(str);
                    } catch (e) {
                        return callback("Error parsing response from persona: " + str, null);
                    }

                    if (data) {
                        if (data.error) {
                            return callback(data.error, null);
                        } else {
                            return callback(null, data);
                        }
                    }
                    return callback("Could not get Profile By Guid", null);
                });
            } else {
                var err = "getProfileByGuid failed with status code " + resp.statusCode;
                _this.error(err);
                return callback(err, null);
            }
        });

    req.on("error", function (e) {
        var err = "getProfileByGuid problem: " + e.message;
        _this.error(err);
        callback(err, null);
    });
    req.end();
};

/**
 * Get all profiles for an array of GUIDs.
 *
 * TODO Neither the client lib nor Persona impose restriction on amount of GUIDs requested. Limit in calling app for now.
 *
 * @param  {object}   opts     [description]
 * @param  {array}    opts.guids  Array of GUIDs to fetch profiles for
 * @param  {string}   opts.token  Auth token
 * @param  {string}   opts.xRequestId Optional request ID to pass through in logging.
 * @param  {Function} callback
 */
PersonaClient.prototype.getProfilesForGuids = function getProfilesForGuids(opts, callback) {
    validateOpts(opts, {
        guids: _.isArray,
        token: _.isString
    });
    var log = this.log.bind(this);
    var guids = opts.guids;
    var token = opts.token;
    var xRequestId = opts.xRequestId || uuid.v4();
    var _this = this;

    var ids = guids.join(',');

    var options = {
        hostname: _this.config.persona_host,
        port: _this.config.persona_port,
        path: API_VERSION_PREFIX + '/users?guids=' + ids,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'User-Agent': _this.userAgent,
            'X-Request-Id': xRequestId
        }
    };

    var personaReq = _this.http.request(options, function personaReq(personaResp) {
        var userString = '';

        personaResp.on('data', function onData(chunk) {
            userString += chunk;
        });

        personaResp.on('end', function onEnd() {
            if (personaResp.statusCode === 200) {
                var data = JSON.parse(userString);
                var results = [];
                if (!_.isEmpty(data)) {
                    if (_.isArray(data)) {
                        results = data;
                    } else {
                        results.push(data);
                    }
                }
                callback(null, results);
            } else {
                var error = new Error();
                var statusCode = personaResp.statusCode || 0;
                error.http_code = statusCode;
                log('error', 'getProfilesForGuids failed with status code ' + statusCode);
                callback(error, null);
            }
        });
    });

    personaReq.on('error', function (err) {
        callback(err, null);
    });

    personaReq.on('clientError', function (err) {
        callback(err, null);
    });

    personaReq.end();
};

/**
 * Removes any tokens that are cached for the given id and secret
 * @param id
 * @param secret
 * @param callback
 * @private
 */
PersonaClient.prototype._removeTokenFromCache = function (id, secret, callback) {
    var cacheKey = this._formatCacheKey(
        "obtain_token:" + hashKey(id)
    );
    var _this = this;

    _this.tokenCache.del(cacheKey, function (err) {
        _this.debug("Deleting " + cacheKey + " and retrying obtainToken..");
        callback(err);
    });
};

/**
 * Get scope information for a user
 * @param {object} opts mandatory: guid, token; optional: xRequestId
 * @param {function} callback
 * @param callback
 */
PersonaClient.prototype.getScopesForUser = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        token: _.isString
    });
    var guid = opts.guid;
    var token = opts.token;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;

    var options = {
            hostname: _this.config.persona_host,
            port: _this.config.persona_port,
            path: API_VERSION_PREFIX + "/clients/" + guid,
            method: 'GET',
            headers: {
                Authorization: "Bearer " + token,
                'User-Agent': _this.userAgent,
                'X-Request-Id': xRequestId
            }
        },
        req = _this.http.request(options, function (resp) {
            if (resp.statusCode === 200) {
                var str = '';

                resp.on("data", function (chunk) {
                    str += chunk;
                });

                resp.on("end", function () {
                    var data;
                    try {
                        data = JSON.parse(str);
                    } catch (e) {
                        callback("Error parsing response from persona: " + str, null);
                        return;
                    }

                    if (data && data.scope) {
                        callback(null, data.scope);
                    } else if (data && data.error) {
                        callback(data.error, null);
                    } else {
                        callback("Could not get Scopes for Guid", null);
                    }
                });
            } else {
                var err = "getScopesForUser failed with status code " + resp.statusCode;
                _this.error(err);
                callback(err, null);
            }
        });

    req.on("error", function (e) {
        var err = "getScopesForUser problem: " + e.message;
        _this.error(err);
        callback(err, null);
    });

    req.end();
};

/**
 * Helper method to set the scopes for a user - can add or remove a scope by passing scopeChange appropriately
 * @param guid
 * @param token
 * @param scopeChange
 * @param xRequestId
 * @param callback
 */
PersonaClient.prototype._applyScopeChange = function (guid, token, scopeChange, xRequestId, callback) {
    if (_.isFunction(xRequestId)) {
        callback = xRequestId; // third param is actually next(), for backwards compat.
        xRequestId = uuid.v4();
    }

    try {
        _.map([guid, token], function (arg) {
            if (!_.isString(arg)) {
                throw "guid, token are required strings";
            }
        });

        if (!scopeChange) {
            throw "scopeChange is required";
        }
    } catch (e) {
        callback(e, null);
        return;
    }

    var _this = this;

    var options = {
            hostname: _this.config.persona_host,
            port: _this.config.persona_port,
            path: API_VERSION_PREFIX + "/clients/" + guid,
            method: 'PATCH',
            json: true,
            headers: {
                Authorization: "Bearer " + token,
                'Content-Type': 'application/json',
                'User-Agent': _this.userAgent,
                'X-Request-Id': xRequestId
            }
        },
        req = _this.http.request(options, function (resp) {
            var data = "";

            resp.on('data', function (chunk) {
                data += chunk;
            });

            resp.on('end', function () {
                var err = null;

                // call to set scopes returns 204 if successful
                if (resp.statusCode !== 204) {
                    err = "setScopesForUser failed with status code " + resp.statusCode;
                    _this.error(err);
                }

                callback(err, null);
            });
        });

    req.on("error", function (e) {
        var err = "setScopesForUser problem: " + e.message;
        _this.error(err);
        callback(err, null);
    });

    req.write(JSON.stringify({
        scope: scopeChange
    }));
    req.end();
};

/**
 * Add a specific scope to a user
 * @param {object} opts mandatory: guid, token, scope; optional: xRequestId
 * @param {function} callback
 * @param callback
 */
PersonaClient.prototype.addScopeToUser = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        token: _.isString,
        scope: _.isString
    });

    var guid = opts.guid;
    var token = opts.token;
    var scope = opts.scope;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    var scopeChange = {
        $add: scope
    };

    _this._applyScopeChange(guid, token, scopeChange, xRequestId, callback);
};

/**
 * Remove a specific scope from a user
 * @param {object} opts mandatory: guid, token, scope; optional: xRequestId
 * @param {function} callback
 * @param callback
 */
PersonaClient.prototype.removeScopeFromUser = function (opts, callback) {
    validateOpts(opts, {
        guid: _.isString,
        token: _.isString,
        scope: _.isString
    });

    var guid = opts.guid;
    var token = opts.token;
    var scope = opts.scope;
    var xRequestId = opts.xRequestId || uuid.v4();

    var _this = this;
    var scopeChange = {
        $remove: scope
    };

    _this._applyScopeChange(guid, token, scopeChange, xRequestId, callback);
};

/**
 * Log wrapping functions
 * @param severity ( debug or error )
 * @param message
 * @returns {boolean}
 */
PersonaClient.prototype.log = function (severity, message) {
    if (!this.config.enable_debug) {
        return true;
    }

    if (this.config.logger) {
        if (severity === DEBUG) {
            this.config.logger.debug("[persona_client] " + message);
        } else if (severity === ERROR) {
            this.config.logger.error("[persona_client] " + message);
        } else {
            console.log(severity + ": [persona_client] " + message);
        }
    } else {
        console.log(severity + ": [persona_client] " + message);
    }
};

PersonaClient.prototype.debug = function (message) {
    this.log(DEBUG, message);
};
PersonaClient.prototype.error = function (message) {
    this.log(ERROR, message);
};

/**
 * @param req Request||null
 * @returns {*}
 */
PersonaClient.prototype.getXRequestId = function (req) {
    if (_.has(req, "header") && _.isFunction(req.header) && _.isString(req.header('X-Request-Id'))) {
        return req.header('X-Request-Id');
    } else {
        return uuid.v4();
    }
};

module.exports = PersonaClient;

