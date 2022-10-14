# [mercury-bank](https://github.com/savvi-legal/mercury-bank.js)

A simple demo of the Mercury API for submitting an Application &amp; Verifying
Webhooks

## Install

```sh
npm install --save mercury-bank
```

## Application

See <https://docs.mercury.com/reference/submit-onboarding-data>.

## Validating Webhooks

Mercury's webhooks must be validated with **two** middleware:

- the first performs _raw_ byte hashing (_before_ JSON parsing)
- the second verifies the hash

See [examples/listen-for-webhooks.js](/examples/listen-for-webhooks.js).

Example:

```js
let Mercury = require("mercury-bank/webhook");

let partnerId = process.env.MERCURY_PARTNER_ID || "demo-partner-id";
let mercury = Mercury.middleware(partnerId);

app.use("/api/webhooks/mercury", mercury);
app.use("/api", bodyParser.json());

app.post("/api/webhooks/mercury", mercury.verify, function (req, res, next) {
  console.info("✅ Valid signature");
  console.info(req.body.accountStatus);
  res.json({ success: true });
});

app.use("/api/webhooks/mercury", function (err, req, res, next) {
  console.error("❌ Invalid signature");
  res.statusCode = 400;
  res.json({ error: "invalid signature" });
});
```
