const moduleName = "[WSO2-JWT]",
  config = require(`${__config}/config`),
  Verify = require("./verify"),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  CLAIM_URI = "http://wso2.org/claims";

require("dotenv").config();

module.exports = function (req, res, next) {
  // use below for development only
  // logger.info("Headers", JSON.stringify(req.headers));
  if (process.env.NODE_ENV === "development" && req.headers.tenant_id)
    return next();
  // pm2 start app.js --watch -env.NODE_ENV='development'

  const options = {};
  const token = req.headers["jwtheader"];
  logger.info("[JWT Token]", token);
  // console.log("JWTHeader token: ", token)
  if (typeof token !== "undefined") {
    // token is missing
    // logger.info(token);

    // region JWT-CALLBACK
    const callback = function (error, data) {
      if (error) {
        // logger.error(error);
        if (data) {
          logger.warn(`${moduleName}[error][data]`, data);
          if (data[CLAIM_URI + "/enduserTenantId"]) {
            req.headers.tenant_id = data[CLAIM_URI + "/enduserTenantId"];
            // req.headers.access_token = data.access_token;
            req.headers.email = data[CLAIM_URI + "/enduser"];
            req.headers.firstname = data[CLAIM_URI + "/givenname"];
            req.headers.lastname = data[CLAIM_URI + "/lastname"];
            req.headers.country = data[CLAIM_URI + "/country"];

            logger.warn("FIXME: Ignoring invalid signature");

            return next();
          } else
            res
              .status(401)
              .send({ success: false, message: "Unauthorized request" });
        } else
          res
            .status(401)
            .send({ success: false, message: "Unauthorized request" });
      } else {
        const user = {
          email: data.enduser,
          tenant_id: data.tenantId,
          access_token: data.access_token,
        };
        req.headers.tenant_id = user.tenant_id;
        req.headers.access_token = user.access_token;
        req.headers.email = user.email;

        logger.info(`jwt-user: ${JSON.stringify(user)}`);

        return next();
      }
    };
    // endregion

    Verify(token, process.env.WSO2_PUBLIC_KEY, options, callback);
  } else {
    logger.warn(moduleName, "JWT is missing from request");
    res.status(403).send({ success: false, message: "Unauthorized request" });
  }
};
