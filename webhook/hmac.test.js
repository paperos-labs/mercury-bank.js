"use strict";

let FsSync = require("node:fs");

let HMAC = require("./hmac.js");

async function main() {
  console.info("");

  // Stream mini-test
  process.stdout.write("* (Stream) Signatures match: ");
  let partnerId = "secret";
  let stream1 = FsSync.createReadStream(__filename);
  let stream2 = FsSync.createReadStream(__filename);
  let ts = "12091212890";
  let sig1 = await HMAC.sign(partnerId, ts, stream1);
  if (!(await HMAC.verify(partnerId, ts, stream2, sig1))) {
    throw Error("[SANITY FAIL] cannot HMAC.verify self (stream)");
  }
  console.info("Pass (duh!) 🙃");

  // Sync mini-test
  process.stdout.write("* (Sync) Signatures also match, as expected: ");
  let utf8str = FsSync.readFileSync(__filename, "utf8");
  let sigB = HMAC.signSync(partnerId, ts, utf8str);
  if (!HMAC.verifySync(partnerId, ts, utf8str, sigB)) {
    throw Error("[SANITY FAIL] cannot HMAC.verify self (sync)");
  }
  console.info("Pass");

  // Final Sanity Check
  if (sig1 !== sigB) {
    throw new Error(
      "[SANITY FAIL] sync vs stream yield different HMAC.signatures"
    );
  }
}

main()
  .then(function (err) {
    console.info("PASS");
    console.info("");
    process.exit(0);
  })
  .catch(function (err) {
    console.error(err.message);
    process.exit(1);
  });
