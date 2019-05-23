var errorCodes = {
    INVALID_ANALYTICS_QUERY: 0,
    0: "INVALID_ANALYTICS_QUERY",

    INTERNAL_ANALYTICS_ERROR: 1,
    1: "INTERNAL_ANALYTICS_ERROR",

    NOT_IMPLEMENTED: 2,
    2: "NOT_IMPLEMENTED",
    
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