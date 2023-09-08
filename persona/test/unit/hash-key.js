"use strict";

var should = require("should");
var assert = require("assert");
var sinon = require("sinon");

var hashKey = require('../../client/lib/hash-key');

describe('hash-key', function() {
    it('correctly hashes key', function() {
        [
            {
                key: 'key',
                hash: 'PG4LipwVIkqCKLmpjKFTHQ==',
            },
            {
                key: 'data',
                hash: 'jXd/OF09/siBXSD3SWAm3A=='
            },
            {
                key: 'www.talis.com',
                hash: '+ndbTPexWjfadqriJyG+vA=='
            }
        ].forEach(function(test) {
            hashKey(test.key).should.equal(test.hash);     
        });
    });
});

