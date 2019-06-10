var codesAndLabels = {
    SUCCESS: 0,
    0: "SUCCESS",

    REQUEST_ERROR: 1,
    1: "REQUEST_ERROR",

    INVALID_QUERY: 2,
    2: "INVALID_QUERY",

    INTERNAL_ERROR: 3,
    3: "INTERNAL_ERROR",

    NOT_IMPLEMENTED: 4,
    4: "NOT_IMPLEMENTED",

    NOT_MODIFIED: 5,
    5: "NOT_MODIFIED",

    UNAUTHORISED: 6,
    6: "UNAUTHORISED",

    INSUFFICIENT_SCOPE: 7,
    7: "INSUFFICIENT_SCOPE",

    INVALID_TOKEN: 8,
    8: "INVALID_TOKEN",
    
    UNKNOWN_ERROR: 99,
    99: 'UNKNOWN_ERROR',
};

var httpStatusToCode = function(httpStatusCode, responseBody) {
    switch (httpStatusCode) {
        case 304: 
            return codesAndLabels.NOT_MODIFIED;
        case 400: 
            return codesAndLabels.INVALID_QUERY;
        case 401:
            if (responseBody.error === "invalid_token") {
                return codesAndLabels.INVALID_TOKEN;
            } else {
                return codesAndLabels.UNAUTHORISED;
            }
        case 403:
            return codesAndLabels.INSUFFICIENT_SCOPE;
        case 500:
            return codesAndLabels.INTERNAL_ERROR;
        case 501:
            return codesAndLabels.NOT_IMPLEMENTED;
        default:
            return codesAndLabels.UNKNOWN_ERROR;
    }
};

module.exports.codesAndLabels = codesAndLabels;
module.exports.httpStatusToCode = httpStatusToCode;