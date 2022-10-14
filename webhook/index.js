"use strict";

let M = module.exports;

let HMAC = require("./hmac.js");
M.sign = HMAC.sign;
M.verify = HMAC.verify;
M.signSync = HMAC.signSync;
M.verifySync = HMAC.verifySync;

M.middleware = require("./express.js");

M.request = require("./request.js");
