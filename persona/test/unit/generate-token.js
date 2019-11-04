"use strict";

var should = require("should");
var assert = require("assert");
var sinon = require("sinon");

var generateToken = require('../../client/lib/generate-token')

describe('generate-token', function() {

    var personaClient;
    var response;

    beforeEach(function() {
        response = {
            statusCode: 200,
            events: [],
            on: function(event, callback) {
                this.events[event] = callback;
            },
            triggerEvent: function(eventName, data) {
                this.events[eventName](data);
            }
        };

        personaClient = {
            log: sinon.stub(),
            debug: sinon.stub(),
            error: sinon.stub(),
            config: {
                persona_host: 'localhost',
                persona_port: 80,
                apiVersionPrefix: '',
                persona_oauth_route: '',
                userAgent: 'unit-test'
            },
            tokenCache: {
                get: sinon.stub(),
                set: sinon.stub(),
            },
            http: {
                request: function(opts, callback) {
                    callback(response);
                    return {
                        on: sinon.stub(),
                        write: sinon.stub(),
                        end: sinon.stub()
                    }
                }
            }
        }
    })

    it('calculates the expires time when it\'s a string', function() {
        generateToken(personaClient, 'cachekey', Math.random(), 'username', 'secret', function(err, data) {
            var expectedExpiresAt = (new Date().getTime() / 1000);
            expectedExpiresAt+= 600;
            var expiresDiff = Math.abs(data.expires_at - expectedExpiresAt);
            
            assert(expiresDiff < 10, 'Expires date is ' + expiresDiff + ' seconds off');
        });

        response.triggerEvent('data', JSON.stringify({
            access_token: 'ABC123',
            expires_in: '600'
        }));
        response.triggerEvent('end');
    });

    it('calculates the expires time when it\'s an int', function() {
        generateToken(personaClient, 'cachekey', Math.random(), 'username', 'secret', function(err, data) {
            var expectedExpiresAt = (new Date().getTime() / 1000);
            expectedExpiresAt+= 600;
            var expiresDiff = Math.abs(data.expires_at - expectedExpiresAt);
            
            assert(expiresDiff < 10, 'Expires date is ' + expiresDiff + ' seconds off');
        });

        response.triggerEvent('data', JSON.stringify({
            access_token: 'ABC123',
            expires_in: 600
        }));
        response.triggerEvent('end');
    })
});