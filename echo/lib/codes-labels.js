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
    var code;
    switch (httpStatusCode) {
        case 304: 
            code = codesAndLabels.NOT_MODIFIED;
            break;
        case 400: 
            code = codesAndLabels.INVALID_QUERY;
            break;
        case 401:
            if (responseBody.error === "invalid_token") {
                code = codesAndLabels.INVALID_TOKEN;
            } else {
                code = codesAndLabels.UNAUTHORISED;
            }
            break;
        case 403:
            code = codesAndLabels.INSUFFICIENT_SCOPE;
            break;
        case 500:
            code = codesAndLabels.INTERNAL_ERROR;
            break;
        case 501:
            code = codesAndLabels.NOT_IMPLEMENTED;
            break;
        default:
            code = codesAndLabels.UNKNOWN_ERROR;
            break;
    }
    return code;
};

module.exports.codesAndLabels = codesAndLabels;
module.exports.httpStatusToCode = httpStatusToCode;