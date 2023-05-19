const moduleName = "[e-ocean]",
  request = require("request-promise-native"),
  axios = require("axios"),
  queryString = require("querystring"),
  numbersPoolController = require(`${__controllers}/numbers-pool`),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  xml2JS = require("xml2js").parseString,
  _ = require("underscore"),
  config = require(`${__config}/config`),
  fs = require("fs");

exports.getToPhone = async (data) => {
  logger.info("[getToPhone][params]", data);

  const url = `${config.EOCEAN.TO_CALL.END_POINT}`;
  const body = await getRequestHandler(config.EOCEAN.TO_CALL.SERVER_URL, url);
  if (body && body.data && !body.data.success) {
    throw new Error("Server refused to provide phone number.");
  }

  return {
    success: true,
    data: {
      phoneno: body.data.caller
        ? body.data.caller
        : config.EOCEAN.TO_CALL.PHONE_NO,
    },
  };
};

const getRequestHandler = async (base_url, url) => {
  logger.info("[getRequestHandler][params]", `${base_url}${url}`);
  let axios_res = await axios({
    baseURL: base_url,
    url: url,
  });
  logger.info("[getRequestHandler][Success][Response]", axios_res.data);

  return axios_res;
};

exports.getFromPhone = async (data) => {
  logger.info("[getFromPhone][params]", data);
  const obj = {};
  obj.method = () => {
    if (obj.response.success)
      logger.info("[getFromPhone][Success][Response]", obj.response);
    else logger.warn("[getFromPhone][Error][Response]", obj.response.msg);
    return obj.response;
  };
  try {
    let cellNum = data.cellno.replace("+", "00");
    // if (!cellNum.includes(+92)) {
    // cellNum = cellNum.replace('+', '00')
    logger.info("[CallFrom][getFromPhone][countryCodeUpdate]", cellNum);
    // }

    const url = `${config.EOCEAN.FROM_CALL.END_POINT}?username=${
      config.EOCEAN.FROM_CALL.QUERY_PARAMS.username
    }&password=${
      config.EOCEAN.FROM_CALL.QUERY_PARAMS.password
    }&number=${encodeURIComponent(cellNum)}`;
    const body = await getRequestHandler(
      config.EOCEAN.FROM_CALL.SERVER_URL,
      url
    );
    if (body && body.data && !body.data.success) {
      throw new Error("Server refused to provide phone number.");
    }
    obj.response = {
      success: true,
      data: { phoneno: body.data.caller },
    };
  } catch (e) {
    logger.error("[getFromPhone][Error]", e);
    obj.response = { success: false, msg: e.message };
  }
  return obj.method();
};

exports.smsFromServer = async (data) => {
  logger.info("[smsFromServer][body]", data);
  const obj = {};
  try {
    const short_code = await numbersPoolController.fromSMSCode(
      data.dialing_code
    );
    let query_params = config.EOCEAN.FROM_SMS.QUERY_PARAMS;

    let cellNum = data.cellno.replace("+", "00");
    logger.info("[CallFrom][getFromPhone][countryCodeUpdate]", cellNum);

    query_params["recipient"] = encodeURIComponent(cellNum);
    query_params["originator"] = short_code.cellno;
    query_params[
      "messagedata"
    ] = `<#> Your VerifApp code is: ${data.code} \n${data.hash}`;
    const url = `${config.EOCEAN.FROM_SMS.END_POINT}?${queryString.encode(
      query_params
    )}`;
    const body = await getRequestHandler(
      config.EOCEAN.FROM_SMS.SERVER_URL,
      url
    );
    await xml2JS(body.data, { explicitArray: false }, (err, xmlResponse) => {
      if (err) {
        throw err;
      }
      if (xmlResponse.response.action === "error") {
        throw new Error(xmlResponse.response.data.errorMessage);
      }
      xmlResponse = xmlResponse.response.data.acceptreport;
      const { messagedata, originator, recipient, statusmessage } = xmlResponse;
      obj.response = {
        success: true,
        data: { short_code: originator, cellno: recipient, code: messagedata },
        msg: statusmessage,
      };
    });
    logger.info("[smsFromServer][Success][Response]", obj.response);
    return obj.response;
  } catch (e) {
    logger.error("[smsFromServer][Error][Response]", e);
    throw e;
  }
};

exports.getToShortCode = async (data) => {
  logger.info("[getToShortCode][body]", data);

  const short_code = await numbersPoolController.toSMSCode(data.dialing_code);
  console.log("Short Code", short_code);
  logger.info(
    "[getToShortCode][Success][Response]",
    JSON.stringify(short_code.response)
  );
  return {
    success: true,
    data: { short_code: short_code.cellno },
  };
};

exports.fakeAPI = async (req, res) => {
  res.json({ success: true });
};

exports.whatsappSmsServer = async (data) => {
  logger.info("[whatsappSmsServer][body]", data);
  try {
    let headers = {},
      body = {
        phone: data.cellno,
        media: {
          type: "hsm",
          element_name: "otp_update",
          lang_code: "en",
          localizable_params: [
            {
              default: data.code,
            },
          ],
        },
      },
      JWT = await this.getWBToken();

    headers["Content-Type"] = "application/json";
    headers["Authorization"] = JWT.trim();

    let response = await postRequestHandler(
      config.WHATSAPP_BUSINESS.BASEURL,
      config.WHATSAPP_BUSINESS.SEND_MESSAGE_URL,
      headers,
      body
    );
    if (response.status === 202) {
      logger.info("[whatsappSmsServer][successResponse]", response.data);
      return { success: true, data: response };
    } else if (response.status === 401) {
      // Auth error
      // generate token again and send message
      await this.generateWBToken();
      JWT = await this.getWBToken();
      headers["Authorization"] = JWT.trim();

      response = await postRequestHandler(
        config.WHATSAPP_BUSINESS.BASEURL,
        config.WHATSAPP_BUSINESS.SEND_MESSAGE_URL,
        headers,
        body
      );

      if (response.status === 202) {
        logger.info("[whatsappSmsServer][successResponse]", response.data);
        return { success: true, data: response };
      } else throw new Error("Unable to send Whatsapp SMS.");
    } else throw new Error("Unable to send Whatsapp SMS.");
  } catch (e) {
    logger.error("[whatsappSmsServer][Error][Response]", e);
    throw e;
  }
};

const postRequestHandler = async (base_url, url, headers, body) => {
  logger.info("[postRequestHandler][params]", `${base_url}${url}`);

  return await axios({
    method: "post",
    baseURL: base_url,
    url: url,
    data: body,
    headers: headers,
  })
    .then((response) => {
      logger.info("[postRequestHandler][Success][Response]", response.data);
      return response;
    })
    .catch(async (e) => {
      logger.error("[postRequestHandler][Error][Response]", e);
      if (e.response.status === 401) {
        // Auth error
        // generate token again and send message
        await this.generateWBToken();
        JWT = await this.getWBToken();
        headers["Authorization"] = JWT.trim();

        let response = await postRequestHandler(
          config.WHATSAPP_BUSINESS.BASEURL,
          config.WHATSAPP_BUSINESS.SEND_MESSAGE_URL,
          headers,
          body
        );
        if (response.status === 202) {
          logger.info("[whatsappSmsServer][successResponse]", response.data);
          return { success: true, status: response.status };
        } else throw new Error("Unable to send Whatsapp SMS.");
      } else throw new Error("Unable to send Whatsapp SMS.");
    });
};

exports.generateWBToken = async (req, res) => {
  try {
    logger.info("[generateWBToken]", `${new Date()}`);

    let body = {
      username: config.WHATSAPP_BUSINESS.USERNAME,
      password: config.WHATSAPP_BUSINESS.PASSWORD,
    };

    let response = await postRequestHandler(
      config.WHATSAPP_BUSINESS.BASEURL,
      config.WHATSAPP_BUSINESS.GET_TOKEN_URL,
      {},
      body
    );
    if (response.status === 201) {
      let JWT = response.data.JWTAUTH;
      return new Promise((resolve) => {
        fs.writeFile("src/config/JWTAuth.txt", JWT, (err) => {
          if (err) throw new Error(err.message ? err.message : err);
          logger.info(
            "[generateWBToken][success]",
            `Whatsapp SMS Token generated successfully.`
          );
          resolve("ok");
        });
      });
    } else {
      logger.error(
        "[generateWBToken][Error][Response]",
        "Error while retrieving Token"
      );
    }
  } catch (error) {
    logger.error("[generateWBToken][Error][Response]", error);
    throw error;
  }
};

exports.getWBToken = async (req, res) => {
  try {
    logger.info("[getWBToken]", `${new Date()}`);
    return new Promise((resolve) => {
      fs.readFile("src/config/JWTAuth.txt", "utf-8", async (err, data) => {
        if (err) throw new Error(err.message ? err.message : err);
        logger.info("[getWBToken][success][response]", `${data}`);
        resolve(data);
      });
    });
  } catch (error) {
    logger.error("[getWBToken][Error][Response]", error);
    throw error;
  }
};
