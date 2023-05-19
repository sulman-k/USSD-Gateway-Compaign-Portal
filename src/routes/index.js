const express = require("express"),
  campaign = require(`${__controllers}/campaign`),
  qouta = require(`${__controllers}/qouta`),
  blukProcess = require(`${__controllers}/bulkProcess`),
  upload_list = require(`${__controllers}/upload_list`),
  dashboard = require(`${__controllers}/dashboard`),
  updateCredential = require(`${__controllers}/updateCredential`);

router = express.Router();

require(`${__routes}/campaign`)(router, campaign);
require(`${__routes}/qouta`)(router, qouta);
require(`${__routes}/bulkProcess`)(router, blukProcess);
require(`${__routes}/upload_list`)(router, upload_list);
require(`${__routes}/dashboard`)(router, dashboard);

require(`${__routes}/updateCredential`)(router, updateCredential);
// Default Routes, This line should be the last line of this module.
require(`${__routes}/default`)(router);

module.exports = router;
