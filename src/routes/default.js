const moduleName = "[default]",
  config = require(`${__config}/config`),
  path = require("path"),
  logger = require(`${__utils}/logger/logger`)(moduleName);
module.exports = (router) => {
  const obj = {};

  // DEFAULT_ROUTES
  obj.operationNotAllowed = (res, type) => {
    logger.error("[operationNotAllowed]", type);
    return res.status(404).send();
  };

  router.get("/", function (req, res) {
    res.sendFile(path.normalize(config.root) + "/public/index.html");
  });

  // this must be the last line
  router
    .route("/*")
    .get(function (req, res) {
      obj.operationNotAllowed(res, "GET");
    })
    .post(function (req, res) {
      obj.operationNotAllowed(res, "POST");
    })
    .delete(function (req, res) {
      obj.operationNotAllowed(res, "DELETE");
    })
    .put(function (req, res) {
      obj.operationNotAllowed(res, "PUT");
    });
};
