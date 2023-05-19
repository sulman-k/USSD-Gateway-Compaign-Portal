const { query } = require("../config/sqlDatabase");
const fs = require("fs");
const { getFileData } = require("../utils/helpers");
const moduleName = "[bulkProcess]",
    logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getLists = async(req, res, next) => {
    try {
        logger.info("[getLists][query]", req.query);

        const { table_name } = req.query;
        let result = await query(`SELECT * FROM ${table_name}`);
        if (result.code) {
            logger.error("[getLists][error]", result);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }

        logger.info("[getLists][response]", { success: true, data: result });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        logger.error("[getLists][error]", error);
        res.status(500).json({ success: false, error: error });
    }
};
exports.addLists = async(req, res, next) => {
    try {
        logger.info("[addLists][body]", req.body);
        let filePath = req.file.path;
        filePath = filePath.replace(/\\/g, "/");
        const { table_name } = req.body;
        if (!req.file) {
            logger.error("[addLists][error]", req.file);

            return res.status(422).json({ success: false, message: "Invalid data." });
        }
        //const data = await getFileData(req);
        // let result = await query(
        //   `INSERT INTO ${table_name} (msisdn) VALUES ${data};`
        // );
        let result = await query(
            `LOAD DATA LOCAL INFILE '${filePath}'  INTO TABLE ${table_name} FIELDS TERMINATED BY ','`
        );
        let _result = await query(
            `UPDATE ${table_name} SET created_by='${req.user_id}';`
        );
        if (result.code || _result.code) {
            logger.error("[addLists][error]", result.code || _result.code);

            return res
                .status(400)
                .json({ success: false, message: "Sorry could not add the list" });
        }
        fs.unlinkSync(req.file.path);
        logger.info("[addLists][response]", {
            success: true,
            messgae: "Successfully process the list",
        });

        res.status(200).json({
            success: true,
            messgae: "Successfully process the list",
        });
    } catch (error) {
        logger.error("[addLists][error]", error);

        fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, error: error });
    }
};

exports.deleteLists = async(req, res, next) => {
    try {
        logger.info("[deleteLists][body]", req.body);

        let { ids, table_name } = req.body;
        if (ids.length == 0 || ids == undefined || !table_name) {
            logger.error("[deleteLists][error]", req.body);
            return res.status(422).json({ success: false, message: "Invalid data." });
        }
        result = await query(`DELETE FROM ${table_name} WHERE id IN  (${ids})`);

        if (result.code) {
            logger.error("[deleteLists][error]", result);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }

        logger.info("[deleteLists][response]", {
            success: true,
            messgae: "Successfully! delete the records",
            data: result,
        });

        res.status(200).json({
            success: true,
            messgae: "Successfully! delete the records",
            data: result,
        });
    } catch (error) {
        logger.error("[deleteLists][error]", error);
        res.status(500).json({ success: false, error: error });
    }
};