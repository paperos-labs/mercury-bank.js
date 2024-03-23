# [mercury-bank](https://github.com/paperos-labs/mercury-bank.js)

A simple demo of the Mercury API for submitting an Application &amp; Verifying
Webhooks

## Install

```sh
npm install --save @paperos/mercury-bank
```

## Partner ID & Secret

You'll need to contact Mercury to get your Partner ID and Secret.

#### Partner ID

The Partner ID will be a URL-safe version of your company name.

Example:

```txt
AcmeInc
```

#### Partner Secret

The Partner Secret will be a Base64 (non-url-safe) 33 byte array.

Example:

```txt
zuud7+978BTnEXQvgTETaX+goDIii/PHu4Sgw/Sg+kYO
```

#### GPG Encrypting / Decrypting

Mercury may ask you to provide a GPG Public Key in order to send you an
encrypted secret.

You can use [`gpg-pubkey`](https://webinstall.dev/gpg-pubkey) to do that:

- https://webinstall.dev/gpg-pubkey

When you get back the encrypted secret, you can decrypt it like this:

```sh
gpg --output ./mercury-partner-secret.txt --decrypt ~/Downloads/partner-secret.enc
```

## Application

Using your _Partner ID_ (ex: "AcmeInc") you can create **sign-up links** to
_partially-completed_ Mercury applications for your users.

See <https://docs.mercury.com/reference/submit-onboarding-data>.

The response you'll get back will have a **Sign Up Link** and an **Application
ID**, which looks like this:

```json
{
  "signupLink": "https://mercury.com/signup?alphaCode=AcmeInc-XXXXXX",
  "onboardingDataId": "00000000-0000-1000-0000-000000000000"
}
```

If the user completes the application you'll get back a number of possible
webhooks as described in the docs above.

If all goes well you'll get the **Routing Number** and **Account Number** in the
final webhook.

## Validating Webhooks

Your **Partner Secret** (ex: "zu+...kYO") is used for validating Mercury
webhooks.

Since the validation is performed on the **raw bytes** of the request, the
process is split into **two middleware**:

- the first performs _raw_ byte hashing (_before_ JSON parsing)
- the second verifies the hash

See [examples/listen-for-webhooks.js](/examples/listen-for-webhooks.js).

Example:

```js
let Mercury = require("@paperos/mercury-bank/webhook");

let partnerSecret =
  process.env.MERCURY_PARTNER_SECRET || "demo-partner-base64-encoded-secret";
let mercury = Mercury.middleware(partnerSecret);

// MUST come before JSON parser due to *exact* byte hash comparison
app.use("/api/webhooks/mercury", mercury.pipeRequestBody);
app.use("/api", bodyParser.json());

app.post(
  "/api/webhooks/mercury",
  mercury.verifySignature,
  function (req, res, next) {
    console.info("✅ Valid signature");
    console.info(req.body.accountStatus);
    res.json({ success: true });
  }
);

// Error handler
app.use("/api/webhooks/mercury", function (err, req, res, next) {
  console.error("❌ Invalid signature");
  res.statusCode = 400;
  res.json({ error: "invalid signature" });
});
```

### Webhook Events

```json
{
  "event": "application_submitted",
  "onboardingDataId": "00000000-0000-1000-0000-000000000000"
}
```

```json
{
  "event": "information_requested",
  "onboardingDataId": "00000000-0000-1000-0000-000000000000"
}
```

```json
{
  "event": "approved",
  "onboardingDataId": "00000000-0000-1000-0000-000000000000",
  "accountStatus": "approved",
  "accountNumber": "123456789",
  "routingNumber": "555555555"
}
```

```json
{
  "onboardingDataId": "00000000-0000-1000-0000-000000000000",
  "accountStatus": "rejected"
}
```
