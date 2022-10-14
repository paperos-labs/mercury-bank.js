"use strict";

let PORT = process.env.NODE || 6372; // MERC

let Http = require("http");

let Mercury = require("../webhook");

let bodyParser = require("body-parser");
let express = require("express");

let app = express.Router();
let server = express();

let partnerId = "demo-partner-id";
let mercury = Mercury.middleware(partnerId);

app.use("/api/webhooks/mercury", mercury);
app.use("/api", bodyParser.json());
app.post("/api/webhooks/mercury", mercury.verify, function (req, res, next) {
  console.info("✅ Valid signature");
  console.info(req.headers["mercury-signature"]);
  console.info(req.body);
  res.json({ message: "valid signature" });
});
app.use("/api/webhooks/mercury", function (err, req, res, next) {
  console.error("❌ Invalid signature");
  console.error(req.headers["mercury-signature"]);
  console.error(req.body);
  res.statusCode = 400;
  res.json({ error: "invalid signature" });
});

server.use(app);

let httpServer = Http.createServer(server);
httpServer.listen(PORT, function () {
  console.info("");
  console.info("Listening on", httpServer.address());
  console.info("");
  console.info(
    `export MERCURY_WEBHOOK_URL=http://localhost:${PORT}/api/webhooks/mercury`
  );
  console.info(`export MERCURY_PARTNER_ID=${partnerId}`);
  console.info("");
});
