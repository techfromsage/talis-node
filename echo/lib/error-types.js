module.exports;

const ResultCode = {
    INVALID_ANALYTICS_QUERY: 0,
    0: "INVALID_ANALYTICS_QUERY",

    INTERNAL_ANALYTICS_ERROR: 1,
    1: "INTERNAL_ANALYTICS_ERROR",

    NOT_IMPLEMENTED: 2,
    2: "NOT_IMPLEMENTED",

    SERVER_ERROR: 3,
    3: "SERVER_ERROR",
    
    UNKNOWN: 99,
    99: 'UNKNOWN',
};

const HttpStatusToResultCode = {
    401: ResultCode.INVALID_ANALYTICS_QUERY,
}

const resultCode = HttpStatusToResultCode[resp.statusCode] === undefined
    ? ResultCode.UNKNOWN
    : HttpStatusToResultCode[resp.statusCode];

const resultLabel = ResultCode[resultCode];