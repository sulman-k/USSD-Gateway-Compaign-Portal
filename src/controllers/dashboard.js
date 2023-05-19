const { query, connection } = require("../config/sqlDatabase");
const _ = require("underscore");
var moment = require("moment"); // require
const { object } = require("underscore");
const moduleName = "[dashboard]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.totalCampaigns = async (req, res) => {
  try {
    logger.info("[totalCampaigns][controller]");

    let result = await query(
      `SELECT type, COUNT(*) AS total_camp  FROM campaigns WHERE user_id ='${req.headers.enduser}' GROUP BY type`
    );

    if (result.code) {
      logger.error("[totalCampaigns][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    result = _.difference(result, ["meta"]);
    if (result.length && result.length < 2)
      result[0].type == 1
        ? result.push({ type: "2", total_camp: 0 })
        : result.push({ type: "1", total_camp: 0 });

    logger.info("[totalCampaigns][response]", { success: true, data: result });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[totalCampaigns][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.dateWiseCampaign = async (req, res) => {
  try {
    logger.info("[dateWiseCampaign][query]", req.query);

    let interactive = await query(
      `SELECT DATE(created_date) AS x, COUNT(*) AS y,type FROM campaigns where user_id ='${req.headers.enduser}' and created_date BETWEEN '${req.query.st_dt}' AND '${req.query.end_dt}' AND type=2 GROUP BY DATE(created_date) `
    );
    let non_interactive = await query(
      `SELECT DATE(created_date) AS x, COUNT(*) AS y,type FROM campaigns where user_id ='${req.headers.enduser}' and  created_date BETWEEN '${req.query.st_dt}' AND '${req.query.end_dt}' AND type=1 GROUP BY DATE(created_date) `
    );

    if (interactive.code || non_interactive.code) {
      logger.error(
        "[dateWiseCampaign][error]",
        interactive.code || non_interactive.code
      );

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    interactive = _.difference(interactive, ["meta"]);
    non_interactive = _.difference(non_interactive, ["meta"]);

    for (let r of interactive) {
      const d = new Date(r.x);
      const x = moment(d).format("YYYY-MM-DD");
      r.x = x;
    }

    for (let r of non_interactive) {
      const d = new Date(r.x);
      const x = moment(d).format("YYYY-MM-DD");
      r.x = x;
    }

    logger.info("[dateWiseCampaign][response]", {
      success: true,
      data: { interactive: interactive, non_interactive: non_interactive },
    });
    res.status(200).json({
      success: true,
      data: { interactive: interactive, non_interactive: non_interactive },
    });
  } catch (error) {
    logger.error("[dateWiseCampaign][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.unitDetails = async (req, res) => {
  try {
    logger.info("[unitDetails][query]", req.query);

    let result = await query(
      `SELECT SUM(available_units) AS available_units, SUM(total_units) AS total_units FROM user_quota WHERE user_id ='${req.headers.enduser}'`
    );
    if (result.code) {
      logger.error("[unitDetails][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    result = _.difference(result, ["meta"]);

    logger.info("[unitDetails][response]", { success: true, data: result });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[unitDetails][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.campaignUserStats = async (req, res) => {
  try {
    logger.info("[campaignUserStats][params]", req.params);

    let result = await query(
      `SELECT COUNT(*) AS total FROM list_${req.params.id} `
    );
    let result2 = await query(
      `SELECT COUNT(*) AS user_count FROM list_${req.params.id} WHERE status=100;`
    );

    if (result.code || result2.code) {
      logger.error("[campaignUserStats][error]", result.code || result2.code);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    Object.assign(result[0], { user_count: result2[0].user_count });
    result = _.difference(result, ["meta"]);

    logger.info("[campaignUserStats][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[campaignUserStats][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getCampaignSuccessHistory = async (req, res) => {
  try {
    logger.info("[getCampaignSuccessHistory][params]", req.params);
    let queryResult = await query(`SELECT
    sum(IF(success = 1, 1, 0)) AS success,
    sum(IF(success = 0, 1, 0)) AS failed,
    sum(IF(ISNULL(user_response) = 0, 1, 0)) AS responded,
    sum(IF(ISNULL(user_response) = 1, 1, 0)) AS not_responded
from campaign_history where campaign_id = ${req.params.id}`);
    if (queryResult.code) {
      logger.error(
        "[getCampaignSuccessHistory][error]",
        queryResult.code 
      );
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    const result = {
      success: queryResult[0].success,
      failed: queryResult[0].failed,
      responded: queryResult[0].responded,
      not_responded: queryResult[0].not_responded
    };
    logger.info("[getCampaignSuccessHistory][response]", {
      success: true,
      data: {
        success: queryResult[0].success,
        failed: queryResult[0].failed,
        responded: queryResult[0].responded,
        not_responded: queryResult[0].not_responded
      },
    });
    res.status(200).json({ success: true, data: result});
  } catch (error) {
    logger.error("[getCampaignSuccessHistory][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.campaignProgressStats = async (req, res) => {
  try {
    logger.info("[campaignProgressStats][query]", req.query);

    let result = await query(
      `SELECT COUNT(*) AS total ,status,type FROM campaigns where user_id ='${req.headers.enduser}' GROUP BY status, type`
    );
    if (result.code) {
      logger.error("[campaignProgressStats][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    result = _.difference(result, ["meta"]);
    for (let r of result) {
      r.type == 2 ? (r.subType = "intrective") : (r.subType = "non_intrective");
      r.status == 0
        ? (r.subStaus = "PENDING")
        : r.status == 10
        ? (r.subStaus = "IN_PROGRESS")
        : r.status == -100
        ? (r.subStaus = "STOP")
        : r.status == 100
        ? (r.subStaus = "COMPLETED")
        : r.status == 20
        ? (r.subStaus = "PAUSE ")
        : "";
    }

    logger.info("[campaignProgressStats][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("[campaignProgressStats][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};
