#!/usr/bin/env node
"use strict";

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.secret" });

let Mercury = require("../");

let partnerId = process.env.MERCURY_PARTNER_ID || "";
let webhookUrl = process.env.MERCURY_WEBHOOK_URL || "";

let Fs = require("node:fs/promises");
let Path = require("node:path");

async function main() {
  let args = process.argv.slice(2);
  let applicationPath = args[0];
  if (!applicationPath) {
    throw new Error(`\n\nUsage:\n    apply ./path/to/application.json\n\n`);
  }
  let mercury = Mercury.create({
    partnerId,
    webhookUrl,
  });

  let applicationTxt = await Fs.readFile(applicationPath, "utf8");
  /** @type {Mercury.Application} */
  let application = JSON.parse(applicationTxt);
  await readFilesIntoApplication(application);

  console.log(JSON.stringify(application, null, 2));
  return;

  /*
  let response = await mercury.apply(application);
  console.log(response.statusCode);
  console.log(response.headers);
  console.log(response.body);
  */
}

/**
 * @param {Mercury.Application} application
 */
async function readFilesIntoApplication(application) {
  // TODO Mercury.readBlobs
  await application.beneficialOwners.reduce(async function (promise, owner) {
    await promise;

    owner.identificationBlob = await readBlob(
      owner.identificationBlob,
      "owner.identificationBlob",
      owner.email
    );
  }, Promise.resolve());

  application.formationDetails.formationDocumentFileBlob = await readBlob(
    application.formationDetails.formationDocumentFileBlob,
    "formationDetails.formationDocumentFileBlob",
    application.about.legalBusinessName
  );

  application.formationDetails.eINDocumentFileBlob = await readBlob(
    application.formationDetails.eINDocumentFileBlob,
    "formationDetails.eINDocumentFileBlob",
    application.about.legalBusinessName
  );
}

/**
 * @param {String} filepath - full file path and name
 * @param {String} tplpath - the accessor path of the value
 * @param {String} id - what the file is for
 * @returns {Promise<String>}
 */
async function readBlob(filepath, tplpath, id) {
  if (filepath.startsWith("data:")) {
    // actually the full blob
    return filepath;
  }

  let filename = Path.basename(filepath);
  let ext = Path.extname(filepath).toLowerCase();
  if (!ext) {
    throw new Error(
      `'${tplpath}' for '${id}' is not a filepath with a well-known extension, nor in DataURL format`
    );
  }

  let mime;
  switch (ext) {
    case ".jpg":
    /*falls through*/
    case ".jpeg":
      mime = "image/jpeg";
      break;
    case ".pdf":
      mime = "application/pdf";
      break;
    case ".png":
      mime = "image/pdf";
      break;
    default:
      throw new Error(
        `'${ext}' is not a well-known document extension for 'owner.identificationBlob' for '${id}'`
      );
  }

  let buf = await Fs.readFile(filepath);
  let blob = buf.toString("base64");

  // Ex: data:application/pdf;name=Federal%20EIN.pdf;base64,${einDoc64}
  let urlFilename = encodeURIComponent(filename);
  return `data:${mime};name=${urlFilename};base64,${blob}`;
}

main()
  .then(function () {
    process.exit(0);
  })
  .catch(function (err) {
    console.error("Fail:");
    console.error(err.stack || err);
    process.exit(1);
  });
