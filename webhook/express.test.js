"use strict";

let Fs = require("fs");
let Stream = require("stream");

let Middleware = require("./express.js");
let HMAC = require("./hmac.js");

async function main() {
  console.info("");

  /**
   * @callback Errback
   * @param {Partial<Error>?} err
   */

  /**
   * Acts like a handler, but also testable
   * @param {import('express').Request} req
   * @param {import('express').Response?} [_]
   * @param {Errback} [next]
   */
  function toBuffer(req, _, next) {
    var converter = new Stream.Writable();

    /** @type Array<Buffer> */
    let data = [];
    converter._write = function (chunk) {
      data.push(chunk);
    };

    converter.on("finish", function () {
      //@ts-ignore
      req.body = Buffer.concat(data).toString("utf8");
      //@ts-ignore
      req.headers["content-length"] = req.body.length;
      if (next) {
        next(null);
      }
    });
    req.pipe(converter);
    req.on("end", function () {
      // docs say 'finish' should emit when end() is called
      // but experimentation says otherwise...
      converter.end();
      converter.emit("finish");
    });
  }

  let partnerId = "secret";
  let middleware = Middleware(partnerId);
  let ts = "12091212890";
  let sig = HMAC.signSync(partnerId, ts, Fs.readFileSync(__filename, "utf8"));
  // test that unverified signature fails
  // faux request as file stream
  /** @type {import('express').Request} */
  //@ts-ignore
  let req = Fs.createReadStream(__filename);
  // add required headers
  req.method = "POST";
  req.headers = {
    "content-length": "0",
    "mercury-signature": `t=1,v1=00000000ffffffff`,
  };
  process.stdout.write("* bad/missing signature should fail: ");
  await new Promise(function (resolve, reject) {
    toBuffer(req, null, function _next2(err) {
      if (err) {
        // not expected to get this error
        reject(err);
        return;
      }
      //@ts-ignore
      middleware.verify(req, null, function _next3(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(null);
      });
    });
  })
    .catch(Object)
    .then(function (err) {
      if (
        !(err instanceof Error) ||
        err.message !== Middleware._mismatchSignature
      ) {
        throw new Error("expected mismatch signature error");
      }
      console.info("Pass");
    });

  // test that verified signature passes
  //@ts-ignore
  req = Fs.createReadStream(__filename);
  // add required headers
  req.method = "POST";
  req.headers = {
    //@ts-ignore
    "content-length": req.byteLength || "0",
    "mercury-signature": `t=${ts},v1=${sig}`,
  };
  process.stdout.write("* correct signature should verify: ");
  await new Promise(function (resolve, reject) {
    /** @type import('express').Response */
    //@ts-ignore
    let res = null;
    middleware(req, res, function _next(err) {
      if (err) {
        // not expected (shouldn't be possible)
        reject(err);
        return;
      }
      toBuffer(req, res, function _next2(err) {
        if (err) {
          // not expected (shouldn't be possible)
          reject(err);
          return;
        }
        //@ts-ignore
        middleware.verify(req, null, function _next3(err) {
          if (err) {
            // not expected (shouldn't be possible)
            reject(err);
            return;
          }
          console.info("Pass");
          resolve(null);
        });
      });
    });
  });
}

main()
  .then(function () {
    console.info("PASS");
    console.info("");
  })
  .catch(function (err) {
    console.error("FAIL");
    console.error(err.message);
    console.error("");
    process.exit(1);
  });
