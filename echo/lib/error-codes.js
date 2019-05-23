const ErrorCodes = {
    INVALID_ANALYTICS_QUERY: 0,
    0: "INVALID_ANALYTICS_QUERY",

    INTERNAL_ANALYTICS_ERROR: 1,
    1: "INTERNAL_ANALYTICS_ERROR",

    NOT_IMPLEMENTED: 2,
    2: "NOT_IMPLEMENTED",
    
    UNKNOWN_ERROR: 99,
    99: 'UNKNOWN_ERROR',
};

const HttpStatusToErrorCode = {
    400: ErrorCodes.INVALID_ANALYTICS_QUERY,
    500: ErrorCodes.INTERNAL_ANALYTICS_ERROR,
    501: ErrorCodes.NOT_IMPLEMENTED
};

module.exports.ErrorCodes = ErrorCodes;
module.exports.HttpStatusToErrorCode = HttpStatusToErrorCode;