const moduleName = "[express]",
    express = require("express"),
    config = require(`${__config}/config`),
    path = require("path"),
    expressValidator = require("express-validator"),
    logger = require(`${__utils}/logger/logger`)(moduleName),
    router = require(`${__routes}/`),
    app = express(),
    cors = require("cors"),
    { getUserProfile } = require(`${__utils}/helpers`),
    corsOptions = {
        origin: "*",
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    },
    swaggerJsDoc = require("swagger-jsdoc"),
    swaggerUi = require("swagger-ui-express");
// fileUpload = require("express-fileupload");
require("dotenv").config();
// swagger definition
const swaggerDefinition = {
    info: {
        description: "This is a node server and it's api documentation is described below",
        version: "1.0.0",
        title: "NODE SERVER",
        termsOfService: "http://telcocompany.com/terms/",
        contact: { email: "info@telcocompany.com" },
        license: {
            name: "Apache 2.0",
            url: "http://www.apache.org/licenses/LICENSE-2.0.html",
        },
    },
    host: "173.32.54.139:8243",
    basePath: "/api/v1",
    schemes: ["https", "http"],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            scheme: "bearer",
            in: "header",
        },
    },
};

// options for the swagger docs
var options = {
    // import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // path to the API docs
    apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(options);

// url to swagger api documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Enable cors policy
app.use(cors(corsOptions));

// Set Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(expressValidator());
// app.use(
//   fileUpload({
//     createParentPath: true,
//   })
// );
// Static resources
app.use(express.static(path.join(config.root, "/public")));

// wso2 jwt validation
if (process.env.NODE_ENV !== "development")
    app.use(require(`${__thirdParty}/jwt/wso2-jwt`));

app.use(async function(req, res, next) {
    // Allowed Origin and Methods, and Headers
    "use strict";
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "HEAD, PUT, POST, GET, OPTIONS, DELETE"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "origin, content-type, Authorization, x-access-token"
    );
    if (req.method === "OPTIONS") {
        logger.warn("[Express][Invalid Request][Method]", req.method);
        return res.status(405).send().end();
    }
    if (!req.get("Authorization")) {
        logger.warn("[Express][Invalid Request][Token is required]");
        return res.status(405).send().end();
    } else {
        const { authorization } = req.headers;
        await getUserProfile(req, authorization);
        next();
    }
});
//app.use("/", require("../routes/index"));

//Routes namespace
app.use("/api/v1", router);

module.exports = app;