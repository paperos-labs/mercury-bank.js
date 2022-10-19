"use strict";

let HMAC = require("./hmac.js");

let request = require("@root/request");

/**
 * Creates a testable signed webhook, exactly as if from Mercury
 * @param {String} partnerSecret - the HMAC shared secret
 * @param {String} webhookUrl - the request url
 * @param {Object} json - { event, onboardingDataId, accountStatus, ... }
 */
module.exports = async function (partnerSecret, webhookUrl, json) {
  let t = Math.floor(Date.now() / 1000).toString();
  let bodyStr = JSON.stringify(json);
  let sig = HMAC.signSync(partnerSecret, t, bodyStr);
  let url = new URL(webhookUrl);

  let resp = await request({
    url: url.toString(),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Mercury-Signature": `t=${t},v1=${sig}`,
    },
    body: bodyStr,
  });

  var isJSON = /[\/\+]json($|;\s)/;
  // "application/json"
  // "application/json; charset=utf-8" (invalid, but common)
  // "application/vnd.github.v3+json"
  if (isJSON.test(resp.headers["content-type"])) {
    resp.body = JSON.parse(resp.body);
  }

  return resp;
};
