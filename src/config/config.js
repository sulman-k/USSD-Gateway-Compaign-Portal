"use strict";
const _ = require("underscore");
require("dotenv").config();

// load configurations
// set the node environment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : "development";

if (process.env.NODE_ENV !== "development") {
  const wso2_key = require("fs").readFileSync("./wso2_pk.pem", "utf8");
  process.env.WSO2_PUBLIC_KEY = process.env.WSO2_PUBLIC_KEY
    ? process.env.WSO2_PUBLIC_KEY
    : wso2_key;
}
// handle uncaught errors
process.on("uncaughtException", function (err) {
  console.error("[config]", err);
});

// extend the base configuration in core.js with environment specific configuration

module.exports = _.extend(
  require("./env/core"),
  require("./env/" + process.env.NODE_ENV) || {}
);

console.info(
  "_______________________________(" +
    process.env.NODE_ENV +
    " environment)_______________________________"
);
