var errorCodesAndLabels = {
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
    
    UNKNOWN_ERROR: 99,
    99: 'UNKNOWN_ERROR',
};

var httpStatusToErrorCode = {
    304: errorCodesAndLabels.NOT_MODIFIED,
    400: errorCodesAndLabels.INVALID_QUERY,
    500: errorCodesAndLabels.INTERNAL_ERROR,
    501: errorCodesAndLabels.NOT_IMPLEMENTED
};

module.exports.errorCodesAndLabels = errorCodesAndLabels;
module.exports.httpStatusToErrorCode = httpStatusToErrorCode;