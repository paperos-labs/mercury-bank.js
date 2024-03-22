"use strict";

let mercuryHmac = require("./hmac.js");

let mismatchSignature =
  "'Mercury-Signature: t=<ts>,v1=<signature>' does not match sha256 hmac of the request body using the shared partner id";

// TODO subclass the error
/**
 * @param {String} msg
 */
function createError(msg) {
  let err = new Error(msg);
  err.message = msg;
  //@ts-ignore
  err.code = "E_MERCURY_WEBHOOK";
  return err;
}

/**
 * @param {String} partnerSecret - the shared secret for HMAC 256
 * @param {Object} [opts]
 * @param {String} [opts.mercuryParam]
 * @param {Boolean} [opts.allowUnsignedGet] - for unsigned uptime check
 */
module.exports = function _createMercuryVerify(partnerSecret, opts = {}) {
  if (!("allowUnsignedGet" in opts)) {
    opts = { allowUnsignedGet: false };
  }
  if (!opts.mercuryParam) {
    opts.mercuryParam = "_mercurySignaturePromise";
  }

  let verifier = {};

  /** @type import('express').Handler */
  verifier.pipeRequestBody = async function _mercuryPipe(req, res, next) {
    if (req.body) {
      next(
        createError(
          "mercury webhook middleware must be 'use()'d  before any body parser"
        )
      );
      return;
    }

    /** @type {String} */
    //@ts-ignore
    let untrustedHeader = req.headers["mercury-signature"] || "t=0,v1=x";
    let parts = { t: "", v1: "" };
    untrustedHeader.split(",").forEach(
      /**
       * @param {String} pair
       */
      function (pair) {
        let kv = pair.split("=");
        //@ts-ignore
        parts[kv[0]] = kv[1];
      }
    );
    // no signature
    if (!untrustedHeader) {
      //@ts-ignore
      req[opts.mercuryParam] = Promise.resolve(false);
      next();
      return;
    }
    //let input = `${parts.t}:${req.body}`;
    let untrustedHexSig = parts.v1;

    // empty content body
    if (
      !req.headers["content-length"] &&
      "chunked" !== req.headers["transfer-encoding"]
    ) {
      //@ts-ignore
      req[opts.mercuryParam] = Promise.resolve(
        mercuryHmac.verifySync(partnerSecret, "", "", untrustedHexSig)
      );
      next();
      return;
    }

    // signature + content body
    //@ts-ignore
    req[opts.mercuryParam] = mercuryHmac
      .verify(partnerSecret, parts.t, req, untrustedHexSig)
      .catch(function () {
        // we ignore this error because we expect stream errors to be handled by
        // a bodyParser
        return "";
      });
    next();
  };

  /** @type import('express').Handler */
  verifier.verifySignature = async function (req, res, next) {
    //@ts-ignore
    let result = await req[opts.mercuryParam];
    if (true === result) {
      next();
      return;
    }

    if (
      opts.allowUnsignedGet &&
      "GET" === req.method &&
      !req.headers["mercury-signature"]
    ) {
      next();
      return;
    }

    next(createError(mismatchSignature));
  };

  return verifier;
};

module.exports._mismatchSignature = mismatchSignature;
