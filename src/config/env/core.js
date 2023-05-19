"use strict";

const path = require("path"),
  rootPath = path.normalize(__root);

require("dotenv").config();

module.exports = {
  SERVER_URL: "",
  root: rootPath,
  host: "localhost",
  port: process.env.PORT || 80,
  db_url: process.env.MONGOHQ_URL,
  db_config: {
    driver: "mongodb",
    host: process.env.DB_SERVER ? process.env.DB_SERVER : "localhost",
    port: "27017",
    dbName: "",
    replicaHost: process.env.DB_REPLICA ? process.env.DB_REPLICA : undefined,
    replicaPort: "27017",
  },

  db_options: {
    keepAlive: 1,
    poolSize: 10,
    native_parser: true,
    auto_reconnect: false,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    connectTimeoutMS: 30000,
    readPreference: "nearest",
  },

  adminCredentials: "Basic " + process.env.APIM_CREDS,
  adminUrl: "https://" + process.env.APIM_URL + ":9443/services/RemoteUserStoreManagerService",
};
