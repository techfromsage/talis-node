var errorCodes = {
    REQUEST_ERROR: 1,
    1: "REQUEST_ERROR",

    INVALID_ANALYTICS_QUERY: 2,
    2: "INVALID_ANALYTICS_QUERY",

    INTERNAL_ANALYTICS_ERROR: 3,
    3: "INTERNAL_ANALYTICS_ERROR",

    NOT_IMPLEMENTED: 4,
    4: "NOT_IMPLEMENTED",
    
    UNKNOWN_ERROR: 99,
    99: 'UNKNOWN_ERROR',
};

var httpStatusToErrorCode = {
    400: errorCodes.INVALID_ANALYTICS_QUERY,
    500: errorCodes.INTERNAL_ANALYTICS_ERROR,
    501: errorCodes.NOT_IMPLEMENTED
};

module.exports.errorCodes = errorCodes;
module.exports.httpStatusToErrorCode = httpStatusToErrorCode;