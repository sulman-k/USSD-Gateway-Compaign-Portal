require("./app-globals");
const moduleName = "[app]",
  app = require(`${__config}/express`),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  config = require(`${__config}/config`),
  server = require("http").Server(app);
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));
// Init Database
// require("./src/config/database");
require("./src/config/sqlDatabase");
// BOOTSTRAP MODELS
const walk = function (path) {
  const fs = require("fs");
  fs.readdirSync(path).forEach(function (file) {
    const newPath = path + "/" + file;
    const stat = fs.statSync(newPath);
    if (stat.isFile()) {
      if (/(.*)\.(js|coffee)/.test(file)) {
        require(newPath);
      }
    } else if (stat.isDirectory()) {
      walk(newPath);
    }
  });
};
walk(__models);

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
    logger.error("[app.js][Unhandled Rejection at Promise]", { reason, p });
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    logger.error("[app.js][Uncaught Exception thrown]", err);

    process.exit(1);
  });

server.listen(3000);
logger.info("Server is listening at ", 3000);
module.exports = server;
