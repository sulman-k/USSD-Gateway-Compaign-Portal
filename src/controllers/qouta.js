const { query } = require("../config/sqlDatabase");
const moduleName = "[qouta]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

const { diameterCharging } = require("../utils/helpers");

exports.getQuota = async (req, res, next) => {
  try {
    logger.info("[getQuota][controller]");

    const result = await query(
      `SELECT * FROM quota_history Where created_by='${req.headers.enduser}'`
    );
    const _result =
      await query(`SELECT available_units,total_units, SUM(total_units - available_units)
    AS remaining_units ,user_id FROM user_quota Where user_id='${req.headers.enduser}'`);

    if (result.code || _result.code) {
      logger.error("[getQuota][error]", result.code || _result.code);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getQuota][response]", {
      success: true,
      data: result,
      quota: _result,
    });
    res.status(200).json({ success: true, data: result, quota: _result });
  } catch (error) {
    logger.error("[getQuota][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addQuota = async (req, res, next) => {
  // const conn = await connection();
  // let { beginTransaction, commit, rollback, end } = conn;
  try {
    logger.info("[addQuota][body]", req.body);

    const {
      msisdn,
      balance,
      package_id,
      price_per_unit,
      number_of_units,
      user_id,
    } = req.body;
    if (
      !msisdn &&
      !balance &&
      !price_per_unit &&
      !number_of_units &&
      !user_id
    ) {
      logger.error("[addQuota][error]", {
        success: false,
        message: "Incomplete data for insertion",
      });

      return res
        .status(422)
        .json({ success: false, message: "Incomplete data for insertion" });
    }

    // await beginTransaction();

    var result = await query(
      `INSERT INTO quota_history (msisdn, balance,package_id,price_per_unit,number_of_units,user_id, created_by) 
      VALUES ('${msisdn}', '${balance}','${package_id}',${price_per_unit} ,${number_of_units},'${user_id}', '${req.headers.enduser}');`
    );

    var user_quota =
      await query(`INSERT INTO user_quota (total_units,user_id,available_units) 
      VALUES(${number_of_units},'${user_id}',${number_of_units}) 
      ON DUPLICATE KEY UPDATE
    total_units=total_units+${number_of_units}, available_units=available_units+${number_of_units}`);

    if (result.code || user_quota.code) {
      logger.error("[addQuota][error]", result.code || user_quota.code);

      // await transRollback(rollback, res);
      await rollbackQuota(result.insertId, user_quota.insertId);
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    // await commit();
    // await end();

    logger.info("[addQuota][response]", {
      success: true,
      messgae: "Successfully insert the record",
      data: result,
    });

    res.status(200).json({
      success: true,
      messgae: "Successfully insert the record",
      data: result,
    });
  } catch (error) {
    await rollbackQuota(result.insertId, user_quota.insertId);
    // await transRollback(rollback, res);
    // await end();
    if (error.errno == 1062) {
      logger.error("[addQuota][error]", error);
      return res.status(409).json({
        success: false,
        message: "Sorry! can't insert the Duplicate record",
      });
    }
    logger.error("[addQuota][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

const rollbackQuota = async (quotaHistory, userQuota) => {
  try {
    await query(`DELETE FROM quota_history WHERE id=${quotaHistory}`);

    await query(`DELETE FROM user_quota WHERE id=${userQuota}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.updateQuota = async (req, res, next) => {
  const conn = await connection();
  let { beginTransaction, commit, rollback, end } = conn;
  try {
    logger.info("[updateQuota][body]", req.body);

    const { balance } = req.body;
    const { id } = req.params;
    console.log("sadss", id);
    if (!balance) {
      logger.error("[updateQuota][error]", {
        success: false,
        message: "Invalid data.",
      });

      return res.status(422).json({ success: false, message: "Invalid data." });
    }

    const _result = await query(`SELECT * FROM quota_history WHERE id=${id}`);

    let addblnc = _result[0].balance + balance;

    var result = await query(
      `UPDATE quota_history SET balance=${addblnc} WHERE id=${id}`
    );
    if (result.code || _result.code) {
      logger.error("[updateQuota][error]", result.code || _result.code);
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[updateQuota][response]", {
      success: true,
      messgae: "quota updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      messgae: "quota updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateQuota][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.getPackages = async (req, res, next) => {
  try {
    logger.info("[getPackages][controller]");

    let result = await query(`SELECT * FROM packages Where status = 100`);
    if (result.code) {
      logger.error("[getPackages][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getPackages][response]", { success: true, data: result });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getPackages][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCustomPackage = async (req, res, next) => {
  try {
    logger.info("[getCustomPackage][controller]");

    let result = await query(`SELECT * FROM custom_package`);

    if (result.code) {
      logger.error("[getCustomPackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[getCustomPackage][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getCustomPackage][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.quotaCharging = async (req, res, next) => {
  try {
    logger.info("[quotaCharging][controller]");

    let { amount, msisdn,shortCode,esmeName } = req.body;

    let result = await diameterCharging(msisdn, amount, req.headers.enduser,shortCode,esmeName );

    console.log("rrrrr", result);

    if (result.code) {
      logger.error("[quotaCharging][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[quotaCharging][response]", {
      success: true,
      data: result.data,
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    logger.error("[quotaCharging][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

// async function transRollback(rollback, res) {
//   try {
//     return await rollback();
//   } catch (error) {
//     logger.error("[transRollback][error]", error);
//     res.status(500).json({ success: false, error: error });
//   }
// }
