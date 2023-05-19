let config = require("../config/env/core");
let request = require("request");
let xml2js = require("xml2js");
var parser = new xml2js.Parser();
const { getSOAPKeySubstring } = require("../utils/helpers");
const moduleName = "[updateCredential]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.updateCredential = async (req, res) => {
  // logger.info("[updateCredential][params]", req.params);

  // let token = req.headers.enduser;
  // console.log("tok");
  let { new_password, old_password } = req.body;
  const emailArray = req.headers.enduser.split("@");

  let updateCredentialBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
    <ser:updateCredential>
    <!--Optional:-->
    <ser:userName>${emailArray[0]}</ser:userName>
    <!--Optional:-->
    <ser:newCredential>${new_password}</ser:newCredential>
    <!--Optional:-->
    <ser:oldCredential>${old_password}</ser:oldCredential>
    </ser:updateCredential>
    </soapenv:Body>
    </soapenv:Envelope>`;

  const updateCredentialOptions = {
    // Request Options to update credential
    method: "POST",
    url: config.adminUrl,
    qs: { wsdl: "" },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${req.headers.enduser}:${old_password}`).toString(
          "base64"
        ),
    },
    body: updateCredentialBody,
    rejectUnauthorized: false, // remove this in production, only for testing
    // ca: [fs.readFileSync([certificate path], { encoding: 'utf-8' })]
  };

  request(updateCredentialOptions, function (error, response, body) {
    console.log("response: " + JSON.stringify(body));
console.log(req.headers.enduser)
console.log("Basic " +
        Buffer.from(`${req.headers.enduser}:${old_password}`).toString(
          "base64"
        ))
    if (error) {
      return res.status(404).send(error.message);
    }
    if (response.statusCode === 401) {
      logger.warn("[getTenant][Error]", "Unauthorized User.");
      return res
        .status(401)
        .send({ success: false, data: "Unauthorized User." });
    }
    if (response.statusCode === 202) {
      return res.send({
        success: true,
        Response: "Password changed successfully",
      });
    }
    if (response.statusCode === 500) {
      return res.status(500).send({
        success: false,
        Response: "Current password invalid.",
      });
    }
    parser.parseString(
      body,
      { explicitArray: false },
      async function (err, result) {
        let getTenantStr =
          result["soapenv:Envelope"]["soapenv:Body"]["soapenv:Fault"]; // soap response error handling
        let data = {
          faultCode: getTenantStr["faultcode"],
          faultString: getTenantStr["faultstring"],
          details: getTenantStr.detail,
        };
        logger.error("[getTenant][Error]", err);
        return res.status(500).json({ success: false, data });
      }
    );
  });
};

exports.getProfile = async (req, res) => {
  // logger.info("[updateCredential][params]", req.params);
  // let token = req.headers.enduser;
  // console.log("tok", token);
  // let { email, new_password, old_password } = req.body;
  // const emailArray = email.split("@");

  let updateCredentialBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
  <soapenv:Header/>
  <soapenv:Body>
  <ser:getUserClaimValues>
  <!--Optional:-->
  <ser:userName>admin</ser:userName>
  <!--Optional:-->
  </ser:getUserClaimValues>
  </soapenv:Body>
  </soapenv:Envelope>`;

  const updateCredentialOptions = {
    // Request Options to update credential
    method: "POST",
    url: config.adminUrl,
    qs: { wsdl: "" },
    headers: {
      Authorization: config.adminCredentials,
    },
    body: updateCredentialBody,
    rejectUnauthorized: false, // remove this in production, only for testing
    // ca: [fs.readFileSync([certificate path], { encoding: 'utf-8' })]
  };
  console.log("response: ");

  request(updateCredentialOptions, function (error, response, body) {
    if (error) {
      logger.error("[getUserClaimValues][Error]", error);
      return res.status(404).send(error.message);
    }
    if (response.statusCode === 401) {
      logger.warn("[getUserClaimValues][Error]", "Unauthorized User.");
      return res
        .status(401)
        .send({ success: false, data: "Unauthorized User." });
    }
    if (response.statusCode === 500) {
      return res.status(500).send({
        success: false,
        Response: "Internal server error 500",
      });
    }
    parser.parseString(body, async function (err, result) {
      let response =
        result["soapenv:Envelope"]["soapenv:Body"][0][
          "ns:getUserClaimValuesResponse"
        ][0]["ns:return"];

      let string = "http://wso2.org/claims/";
      // console.log("response: ", response);
      // console.log("err", err);

      let dataArr = {};

      // let getTenantStr = result['soapenv:Envelope']['soapenv:Body']['ns:getTenantResponse']['ns:return'];

      let str = await getSOAPKeySubstring(response[0]); // get distinct key from soap response data

      for (let obj of response) {
        // console.log("here", obj[`${str}:claimUri"][0]);

        if (obj[`${str}:claimUri`][0] == `${string}givenname`) {
          // console.log("vlaue", obj[`${str}:value"][0]);
          Object.assign(dataArr, { firstname: obj[`${str}:value`][0] });
        }
        if (obj[`${str}:claimUri`][0] == `${string}lastname`) {
          // console.log("vlaue", obj[`${str}:value`][0]);
          Object.assign(dataArr, { lastname: obj[`${str}:value`][0] });
        }
        if (obj[`${str}:claimUri`][0] == `${string}username`) {
          // console.log("vlaue", obj[`${str}:value`][0]);
          Object.assign(dataArr, { username: obj[`${str}:value`][0] });
        }
      }

      Object.assign(dataArr, { email: req.headers.enduser });

      res.status(200).send({
        success: true,
        data: dataArr,
      });

      // let getTenantStr =
      //   result["soapenv:Envelope"]["soapenv:Body"]["soapenv:Fault"]; // soap response error handling
      // let data = {
      //   faultCode: getTenantStr["faultcode"],
      //   faultString: getTenantStr["faultstring"],
      //   details: getTenantStr.detail,
      // };
      // logger.error("[getTenant][Error]", err);
      // return res.status(500).json({ success: false, data });
    });
  });
};
