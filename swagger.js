const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./src/routes/index.js"];

const doc = {
  info: {
    version: "1.0.0",
    title: "USSD Gateway Customer Portal",
    description: "",
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./app.js");
});
