const { query, connection } = require("../config/sqlDatabase");
const fs = require("fs");
const { getFileData, compareKeys, getCodes } = require("../utils/helpers");
const moduleName = "[upload_list]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
exports.getUploadedList = async (req, res, next) => {
  try {
    logger.info("[getUploadedList][controller]");

    let result = await query(
      `SELECT * FROM uploaded_list Where created_by='${req.headers.enduser}'`
    );
    if (result.code) {
      logger.error("[getUploadedList][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[getUploadedList][response]", { success: true, data: result });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getUploadedList][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteUploadedList = async (req, res, next) => {
  try {
    logger.info("[deleteUploadedList][params]", req.params);

    let id = req.params.id;
    let result = await query(`DELETE FROM uploaded_list where id=${id}`);

    let removeList = await query(`DROP TABLE list_upload_${id}`);

    if (result.code || removeList.code) {
      logger.error(
        "[deleteUploadedList][error]",
        result.code || removeList.code
      );

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteUploadedList][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[deleteUploadedList][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.uploadList = async (req, res, next) => {
  logger.info("[uploadList][body]", req.body);
  // const conn = await connection();
  // let { beginTransaction, commit, rollback, end } = conn;
  let name = req.body.name;
  let filePath = req.file.path;
  filePath = filePath.replace(/\\/g, "/");
  if (!name || !req.file) {
    logger.error("[uploadList][error]", {
      success: false,
      message: "Name or file not found",
    });
    return res
      .status(4022)
      .json({ success: false, message: "Name or file not found" });
  }
  try {
    // await connection().beginTransaction();
    //const data = await getFileData(req);
    const result = await query(
      `INSERT INTO uploaded_list (name, created_by) VALUE ('${name}','${req.headers.enduser}');`
    );
    const table_created = await query(
      `CREATE TABLE IF NOT EXISTS list_upload_${result.insertId} (
        msisdn        varchar(13)     unique        null,
        status        varchar(255) default '0' null,
        id int auto_increment primary key,
        user_response varchar(255)             null
            );`
    );
    // const list_inserted = await query(
    //   `INSERT INTO list_upload_${result.insertId} (msisdn) VALUES ${data};`
    // );
    const list_inserted = await query(
      `LOAD DATA LOCAL INFILE '${filePath}'  INTO TABLE list_upload_${result.insertId} FIELDS TERMINATED BY ','`
    );

    let updateFormat = await query(
      `update list_upload_${result.insertId} set msisdn=REGEXP_SUBSTR(msisdn,"[0-9]+"), status = '0';`
    );
    if (updateFormat.code) {
      logger.error("[uploadList][error]", updateFormat);
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

      //Handle invalid numbers
      //Delete all invalid numbers that are not 11 or 13 digits
      await query(
        `DELETE FROM list_upload_${result.insertId} WHERE LENGTH(msisdn) not in (11,13);`
      );

    //await query(`UPDATE list_upload_${result.insertId} SET status='0';`);
    if (list_inserted.affectedRows) {
      const _result = await query(
        `Update uploaded_list set records=${list_inserted.affectedRows} where id=${result.insertId}`
      );
      if (_result.code) {
        logger.error("[uploadList][error]", list_inserted);
        return res.status(400).json({ success: false, message: _result.text });
      }
    }
    if (list_inserted.code) {
      logger.error("[uploadList][error]", list_inserted);
      // await rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    if (result.code || table_created.code || list_inserted.code) {
      logger.error("[uploadList][error]", result);
      // await rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    fs.unlinkSync(req.file.path);
    // await commit();
    // await end();
    logger.info("[uploadList][response]", {
      success: true,
      messgae: "uploaded list successfully",
      data: result,
    });
    res.status(200).json({
      success: true,
      messgae: "uploaded list successfully",
      data: result,
    });
  } catch (error) {
    console.log("rollback in catch block");
    // await rollback();
    // let c = await conn.end();
    // console.log(connection().beginTransaction().rollback());
    fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: error });
  }
};
