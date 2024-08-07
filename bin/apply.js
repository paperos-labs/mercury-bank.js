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
  let dryRun = removeFlag(args, ["--dry-run"]);
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

  if (dryRun) {
    application = mercury._complete(application);
    console.info(JSON.stringify(application, null, 2));
    return;
  }

  let response = await mercury.apply(application);
  console.info(response.statusCode);
  console.info(JSON.stringify(response.headers, null, 2));
  console.info(JSON.stringify(response.body, null, 2));
}

/**
 * @param {Array<String>} args
 * @param {Array<String>} names
 */
function removeFlag(args, names) {
  let val = false;
  let i = -1;
  names.forEach(function (name) {
    let index = args.indexOf(name);
    if (index >= 0) {
      if (val) {
        throw new Error(`duplicate '${name}' of '${names}'`);
      }
      i = index;
      val = true;
    }
  });
  if (i >= 0) {
    args.splice(i, 1);
  }
  return val;
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
 * @param {String} filepathOrBase64 - full file path and name, or base64-encoded file
 * @param {String} tplpath - the accessor path of the value
 * @param {String} id - what the file is for
 * @returns {Promise<String>}
 */
async function readBlob(filepathOrBase64, tplpath, id) {
  if (!filepathOrBase64) {
    return "";
  }

  if (filepathOrBase64.startsWith("data:")) {
    // actually the full blob
    let dataUriPrefixRe = /^data:.*;base64,/;
    let base64 = filepathOrBase64.replace(dataUriPrefixRe, "");
    return base64;
  }

  let base64Re = /^[-A-Za-z0-9+/]*={0,3}$/;
  let ext = Path.extname(filepathOrBase64);
  ext = ext.toLowerCase();
  if (!ext) {
    let isBase64 = base64Re.test(filepathOrBase64);
    if (isBase64) {
      return filepathOrBase64;
    }
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

  let buf = await Fs.readFile(filepathOrBase64);
  let base64 = buf.toString("base64");

  // Ex: data:application/pdf;name=Federal%20EIN.pdf;base64,${einDoc64}
  //let filename = Path.basename(filepathOrBase64);
  //let urlFilename = encodeURIComponent(filename);
  //return `data:${mime};name=${urlFilename};base64,${base64}`;
  return base64;
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
