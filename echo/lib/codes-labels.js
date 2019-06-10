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

    UNAUTHORIZED: 6,
    6: "UNAUTHORIZED",
    
    UNKNOWN_ERROR: 99,
    99: 'UNKNOWN_ERROR',
};

var httpStatusToCode = {
    304: codesAndLabels.NOT_MODIFIED,
    400: codesAndLabels.INVALID_QUERY,
    401: codesAndLabels.UNAUTHORIZED,
    500: codesAndLabels.INTERNAL_ERROR,
    501: codesAndLabels.NOT_IMPLEMENTED
};

module.exports.codesAndLabels = codesAndLabels;
module.exports.httpStatusToCode = httpStatusToCode;