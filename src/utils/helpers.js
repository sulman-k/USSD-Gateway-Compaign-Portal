const moduleName = "[Helper]",
  //request = require("request"),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  // parseString = require('xml2js').parseString;
  jwt_decode = require("jwt-decode"),
  axios = require("axios");
csv = require("csvtojson");
(_ = require("lodash")), (regex = new RegExp(/^[0-9]{6,16}$/));

exports.getSOAPKeySubstring = async (string) => {
  let str = Object.keys(string);
  for (let s of str) {
    if (s.includes(":claimUri")) {
      str = s.split(":")[0];
      break;
    }
  }
  return str;
};

// exports.Request = async (options) => {
//     return new Promise(resolve => {
//         request(options, function (error, response, body) {
//             if (error) {
//                 logger.error("[POSTRequest][Error]", error);
//                 throw new Error(error.message);
//             }
//             else if (response.statusCode === 401) {
//                 logger.error("[POSTRequest][Error]", "Unauthorized User.");
//                 throw new Error('Unauthorized User.');
//             }
//             else resolve({ response, body })
//         });
//     });
// }

// exports.parse = async (string) => {
//     return new Promise(resolve => {
//         parseString(string, { explicitArray: false }, async function (err, result) {
//             if (err) throw new Error(err)
//             else resolve(result);
//         });
//     });
// }

exports.mapCountryName = async (allVerifications, countries) => {
  try {
    for (let v of allVerifications) {
      let cObj = countries.find((c) => c.dialing_code == v.dialing_code);
      v.country_name = cObj.name;
    }
    return allVerifications;
  } catch (e) {
    logger.error("[Map Region Country Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};

exports.mapOperatorName = async (data, opt) => {
  try {
    for (let d of data) {
      for (let o of opt) {
        let _obj = o.code.find((c) => c.code == d.operator_code);
        if (_obj) {
          d.operator_name = o.name;
          console.log(d);
        }
      }
    }

    return data;
  } catch (e) {
    logger.error("[Map Operator Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};

let accessToken;
exports.getUserProfile = (req, token = {}) => {
  const CLAIM_URI = "http://wso2.org/claims";
  const user_profile = jwt_decode(token);

  accessToken = token;

  // console.log("yeeee", token);

  req.headers.enduser = user_profile[CLAIM_URI + "/enduser"];
  req.headers.scope = user_profile["scope"];

  req.headers.enduser ? null : (req.headers.enduser = "admin@glo.com");

  const is_admin = req.headers.scope.includes("campaign-admin");
  req.headers.is_admin = is_admin;

  return;
};
exports.getFileData = async (req) => {
  let dataList = [];
  await csv()
    .fromFile(req.file.path)
    .then(async (csvObj) => {
      for (let val = 0; val < csvObj.length; val++) {
        if (regex.test(csvObj[val].msisdn || csvObj[val].MSISDN)) {
          dataList.push(`(${csvObj[val].msisdn || csvObj[val].MSISDN})`);
        }
      }
    });
  return dataList;
};
exports.compareKeys = async (req_key = [], has_keys = [], res) => {
  const result = _.difference(req_key, has_keys);
  return result.length;
};

exports.getMenuTree = async (id) => {
  let response = await axios({
    method: "get",
    url: `http://${process.env.SERVICE_HOST}:${process.env.SERVICE_PORT}/api/v1/getCampaignMenu/${id}`,
    headers: {
      Authorization: accessToken,
    },
  });

  return response.data;
};

exports.diameterCharging = async (msisdn, amount, user,shortCode,esmeName ) => {
  //let Shortcode = "push_code";
  //let esmename = "push_esme";
  let session_id = "BUY_QUOTA";
  let response = await axios({
    method: "get",
    url: `${process.env.DIAMETER}/${msisdn}/${amount}/${shortCode}/${esmeName}/${session_id}`,
    headers: {
      Authorization: accessToken,
    },
  });

  return response;
};
exports.addMenuTree = async (menu, camp_id, camp_menu_name) => {
  let response = await axios({
    method: "post",
    url: `http://${process.env.SERVICE_HOST}:${process.env.SERVICE_PORT}/api/v1/addMenu`,
    data: {
      press_options: menu.press_options,
      service_code_id: camp_id,
      is_whitelist: null,
      is_normal: null,
      menuListCheck: false,
      camp_menu_name: camp_menu_name,
    },
    headers: {
      Authorization: accessToken,
    },
  });

  console.log(response.data);
  return response.data;
};

exports.campStatusUpdate = async (id, status) => {
  let response = await axios({
    method: "put",
    url: `http://${process.env.CAMP_STATUS_HOST}:${process.env.CAMP_STATUS_PORT}/campaign/${id}/${status}`,
    headers: {
      Authorization: accessToken,
    },
  });

  console.log(response.data);
  return response.data;
};

exports.getCampEsmeNames = async () => {
  let response = await axios({
    method: "get",
    url: `http://${process.env.SERVICE_HOST}:${process.env.SERVICE_PORT}/api/v1/getCampaignEsmeNames`,
    headers: {
      Authorization: accessToken,
    },
  });
  return response.data;
};
