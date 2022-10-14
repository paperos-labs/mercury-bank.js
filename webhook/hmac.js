"use strict";

let crypto = require("crypto");

let HMAC = module.exports;

/**
 * HMAC256 sign the timestamp ts and the data from the read stream
 * @param {String} partnerId - the shared secret
 * @param {String} ts - the string unix epoch seconds timestamp
 * @param {import('stream').Readable} rstream - the data
 */
async function sign(partnerId, ts, rstream) {
  let hmac = crypto.createHmac("sha256", partnerId);
  hmac.update(`${ts}.`);
  await new Promise(function (resolve, reject) {
    rstream.pipe(hmac);
    rstream.once("error", reject);
    // 'end' should always fire, even if 'finished' or 'close' don't
    rstream.once("end", resolve);
  });
  return hmac.read().toString("hex");
}

/**
 * HMAC256 verify the timestamp ts and the raw data against a signature
 * @param {String} partnerId - the shared secret
 * @param {String} ts - the timestamp followed by a '.'
 * @param {import('stream').Readable} rstream - the data
 * @param {String} hexSig - the signature, encoded as hex
 */
async function verify(partnerId, ts, rstream, hexSig) {
  let sig2 = await sign(partnerId, ts, rstream);
  if (hexSig.length !== sig2.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(hexSig), Buffer.from(sig2));
}

/**
 * Like sign, but synchronous
 * @param {String} partnerId - the shared secret
 * @param {String} ts - the string unix epochs seconds timestamp
 * @param {String} utf8str - raw json bytes
 */
function signSync(partnerId, ts, utf8str) {
  let hmac = crypto.createHmac("sha256", partnerId);
  hmac.update(`${ts}.${utf8str}`);
  return hmac.digest("hex");
}

/**
 * Like verify, but synchronous
 * @param {String} partnerId - the shared secret
 * @param {String} ts - the string unix epochs seconds timestamp
 * @param {String} utf8str - raw json bytes
 * @param {String} hexSig - the signature, encoded as hex
 */
function verifySync(partnerId, ts, utf8str, hexSig) {
  let sig2 = signSync(partnerId, ts, utf8str);
  if (hexSig.length !== sig2.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(hexSig), Buffer.from(sig2));
}

HMAC.sign = sign;
HMAC.verify = verify;
HMAC.signSync = signSync;
HMAC.verifySync = verifySync;
