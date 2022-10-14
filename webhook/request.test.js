"use strict";

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.secret" });

if (!process.env.MERCURY_WEBHOOK_URL) {
  console.error(
    "You must set MERCURY_WEBHOOK_URL to test against in your ENVs or .env"
  );
  process.exit(1);
}

if (!process.env.MERCURY_PARTNER_ID) {
  console.error(
    "You must set MERCURY_PARTNER_ID to use for HMAC signature in your ENVs or .env.secret"
  );
  process.exit(1);
}

let webhook = require("./request.js");

let partnerId = process.env.MERCURY_PARTNER_ID;
let webhookUrl = process.env.MERCURY_WEBHOOK_URL;

async function main() {
  console.info("");

  process.stdout.write("* Should NOT allow bad partner id... ");
  await webhook("bad-partner-id", webhookUrl, {
    event: "approved",
    onboardingDataId: "9e1618ca-fd68-11ec-9855-132369fb0225",
    accountStatus: "approved",
    accountNumber: "182812819",
    routingNumber: "021000029",
  }).then(mustFail);
  console.info("Pass");

  process.stdout.write("* Testing 'application_submitted'... ");
  await webhook(partnerId, webhookUrl, {
    event: "application_submitted",
    onboardingDataId: "9e1618ca-fd68-11ec-9855-132369fb0225",
  }).then(mustOk);
  console.info("Pass");

  process.stdout.write("* Testing 'information_requested'... ");
  await webhook(partnerId, webhookUrl, {
    event: "information_requested",
    onboardingDataId: "9e1618ca-fd68-11ec-9855-132369fb0225",
  }).then(mustOk);
  console.info("Pass");

  process.stdout.write("* Testing 'approved'... ");
  await webhook(partnerId, webhookUrl, {
    event: "approved",
    onboardingDataId: "9e1618ca-fd68-11ec-9855-132369fb0225",
    accountStatus: "approved",
    accountNumber: "182812818",
    routingNumber: "021000021",
  }).then(mustOk);
  console.info("Pass");

  process.stdout.write("* Testing <undefined> (rejected)... ");
  await webhook(partnerId, webhookUrl, {
    event: undefined, // TODO shouldn't this be defined?
    onboardingDataId: "9e1618ca-fd68-11ec-9855-132369fb0225",
    accountStatus: "rejected",
  }).then(mustOk);
  console.info("Pass");
}

/**
 * @param {import('@root/request').Response} resp
 */
function mustOk(resp) {
  if (!resp.ok) {
    let err = new Error(`expected 200 OK, but got ${resp.statusCode}`);
    //@ts-ignore
    err.response = resp;
    throw err;
  }
  return resp;
}

/**
 * @param {import('@root/request').Response} resp
 */
function mustFail(resp) {
  if (resp.ok) {
    let err = new Error(`expected error, but got ${resp.statusCode}`);
    //@ts-ignore
    err.response = resp;
    throw err;
  }
  return resp;
}

main()
  .then(function () {
    console.info("PASS");
    console.info("");
  })
  .catch(function (err) {
    console.error("FAIL");
    console.error(err.message);
    if (err.response) {
      console.error(err.response.headers);
      console.error(err.response.body);
    }
    process.exit(1);
  });
