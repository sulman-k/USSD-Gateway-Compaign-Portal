const { query } = require("../config/sqlDatabase");
const fs = require("fs");
const {
  getFileData,
  compareKeys,
  addMenuTree,
  getCampEsmeNames,
  getMenuTree,
  campStatusUpdate,
} = require("../utils/helpers");
const axios = require("axios");
const moduleName = "[campaign]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getWhiteListGroups = async (req, res, next) => {
  try {
    logger.info("[getWhiteListGroups][query]", req.query);

    const { table_name } = req.query;
    let result = await query(`SELECT * FROM black_listed_msisdn_group`);
    if (result.code) {
      logger.error("[getWhiteListGroups][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getWhiteListGroups][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getWhiteListGroups][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getCampaigns = async (req, res, next) => {
  try {
    logger.info("[getCampaigns][params]", req.params);

    let id = req.params.id;
    // let result = await query(
    //   `SELECT * FROM campaigns Where type=${id} AND user_id='${req.headers.enduser}'`
    // );

    let result = await query(
    `select camp.id,camp.title,camp.description,camp.complete_date,camp.created_date,
    ifnull(min(hist.request_date),camp.start_date) as start_date, ifnull(max(hist.request_date),camp.end_date) as end_date,
    camp.is_completed,camp.lang,camp.last_ptr, camp.max_ptr,camp.package_id, camp.ptr,
    camp.short_code,camp.status,camp.text,camp.type,camp.user_id,camp.list_id,camp.camp_menu_id,
    camp.redis_flag,camp.priority,camp.forward_response,camp.endpoint,camp.black_list_group_id,camp.send_now   
    from campaigns camp 
    left join campaign_history hist on camp.id = hist.campaign_id
    Where type=${id} AND camp.user_id='${req.headers.enduser}'
    Group By camp.id`);

    if (result.code) {
      logger.error("[getCampaigns][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid query syntax" });
    }

    // for (let data of result) {
    //   let allStatus = await query(
    //     `select count(*) as count from list_${data.id}`
    //   );
    //   let status = await query(
    //     `select count(*) as count from list_${data.id} where status=100`
    //   );
    //   let file = await query(`SELECT title FROM list WHERE id=${data.list_id}`);

    //   let percentage = (status[0].count / allStatus[0].count) * 100;

    //   Object.assign(data, {
    //     progress: Math.trunc(percentage),
    //     fileName: file[0].title,
    //   });
    // }

    logger.info("[getCampaigns][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getCampaigns][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.getCampaignUsers = async (req, res) => {
  try {
    logger.info("[getCampaignUsers][query]", req.query);
    const { id, type } = req.query;
    let checkUserList = await query(`SHOW TABLES LIKE 'list_${id}'`);
    if (checkUserList.length == 0)
      return res
        .status(404)
        .json({ success: false, message: "Data Not Found!" });
    let NonInteractiveQuery = `CREATE TABLE RESP_LIST_${id} SELECT MSISDN,IFNULL(CAMPAIGN_TEXT, 'N/A') AS USER_RESPONSE FROM CH_LIST_${id};`;
    let query2 = ``;
    let query3 = ``;

    let InteractiveQuery = `CREATE TABLE RESP_LIST_${id} SELECT MSISDN,CONCAT(IFNULL(USER_RESPONSE, 'N/A'), '|', CAMPAIGN_TEXT) AS USER_RESPONSE FROM CH_LIST_${id}
        WHERE ISNULL(USER_RESPONSE) = 0;`;

    let query1 = `CREATE TABLE CH_LIST_${id} SELECT CH.MSISDN,CH.USER_RESPONSE,CH.CAMPAIGN_TEXT,CH.REQUEST_DATE FROM list_${id} LIST
        RIGHT JOIN campaign_history CH ON LIST.MSISDN=CH.MSISDN where campaign_id=${id};`;
    if (type == 1) {
      query2 = NonInteractiveQuery;
      console.log("Printed Query:::", query2);
    } else {
      query2 = InteractiveQuery;
      console.log("Printed InteractiveQuery:::", query2);
    }
    if (type == 1) {
      query3 = `SELECT MSISDN, GROUP_CONCAT(USER_RESPONSE) USER_RESPONSE FROM RESP_LIST_${id} M where USER_RESPONSE !='N/A' GROUP BY MSISDN;`;
    } else {
      query3 = `SELECT MSISDN, GROUP_CONCAT(USER_RESPONSE) USER_RESPONSE FROM RESP_LIST_${id} M GROUP BY MSISDN;`;
    }
    let query4 = `DROP TABLE IF EXISTS CH_LIST_${id};`;
    let query5 = `DROP TABLE IF EXISTS RESP_LIST_${id};`;
    await query(query4);
    await query(query5);
    let result1 = await query(query1);
    let result2 = await query(query2);
    let result3 = await query(query3);
    await query(query4);
    await query(query5);
    // //let result = await query(`SELECT msisdn FROM list_${id}`);
    // let campHistory = await query(
    //   `SELECT user_response,msisdn FROM campaign_history where campaign_id=${id}`
    // );
    // for (let a of result) {
    //   for (let b of campHistory) {
    //     if (a.msisdn == b.msisdn) {
    //       if (a.user_response) {
    //         a.user_response =
    //           a.user_response +
    //           "|" +
    //           a.campaign_text +
    //           "," +
    //           b.user_response +
    //           "|" +
    //           b.campaign_text;
    //       } else {
    //         Object.assign(a, {
    //           user_response: b.user_response + "|" + b.campaign_text,
    //         });
    //       }
    //     }
    //   }
    // }
    if (result3.code || checkUserList.code) {
      logger.error(
        "[getCampaignUsers][error]",
        result3.code || checkUserList.code
      );
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[getCampaignUsers][response]", {
      success: true,
      data: result3,
    });
    res.json({ success: true, data: result3 });
  } catch (error) {
    logger.error("[getCampaignUsers][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};
exports.downloadCampaignData = async (req, res) => {
  try {
    logger.info("[getCampaignUsers][query]", req.query);
    const { id, type } = req.query;
    // let NonInteractiveQuery = `select msisdn, campaign_text,user_response, request_date, 
    // case when success = 1 then "true" else "false" end as "success", 
    // case when remarks is not null then remarks else error_message  end as reason  
    // from campaign_history outr  where campaign_id = ${id};`;

    let NonInteractiveQuery = `select msisdn, campaign_text,user_response, convert(Date_Format(request_date,'%Y-%m-%d %H:%m:%s'),CHAR) as request_date, 
    case when success = 1 then "true" else "false" end as "success", 
    case when remarks is not null then remarks else error_message  end as remarks  
    from campaign_history outr  where campaign_id = ${id}
	  union
	  select msisdn, (select text from campaigns where id = ${id}) as campaign_text, NULL as user_response, 
    convert(Date_Format((select start_date from campaigns where id = ${id}),'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,
    "false" as "success",
    "This number is in DND list" as remarks
	  from list_${id} where REGEXP_SUBSTR(msisdn,"[0-9]+") in (select msisdn from black_listed_msisdn where status =100)
	  union
	  select msisdn, (select text from campaigns where id = ${id}) as campaign_text, NULL as user_response, 
    convert(Date_Format((select start_date from campaigns where id = ${id}),'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,
    "false" as "success",
    "This number is in Ported list" as remarks
	  from list_${id} where REGEXP_SUBSTR(msisdn,"[0-9]+") in (select msisdn from port_listed_msisdn)
	  `;

    let InteractiveQuery = `
    select msisdn, convert(Date_Format(max(request_date),'%Y-%m-%d %H:%m:%s'),CHAR) as request_date, NULL as "success", NULL as "remarks", 
    replace(group_concat(campaign_text, ""),"\n","") as campaign_text, group_concat(user_response , "") as user_response
    from campaign_history where campaign_id = ${id} group by msisdn
    union 
    select msisdn, convert(Date_Format((select start_date from campaigns where id = ${id}),'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,"false" as "success","This number is in DND list" as remarks, 
    (select text from campaigns where id = ${id}) as campaign_text, NULL as user_response
    from list_${id} where REGEXP_SUBSTR(msisdn,"[0-9]+") in (select msisdn from black_listed_msisdn where status =100)
    union 
    select msisdn, convert(Date_Format((select start_date from campaigns where id = ${id}),'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,"false" as "success",
    "This number is in Ported list" as remarks, 
    (select text from campaigns where id = ${id}) as campaign_text, NULL as user_response
    from list_${id} where REGEXP_SUBSTR(msisdn,"[0-9]+") in (select msisdn from port_listed_msisdn)
    `;

    if (type == 1) {
      console.log("Printed Query:::", NonInteractiveQuery);
      let result = await query(NonInteractiveQuery);
      if (result.code) {
        logger.error("[getCampaignUsers][error]", result.code);
        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }
      logger.info("[getCampaignUsers][response]", {
        success: true,
        data: result,
      });
      res.json({ success: true, data: result });
    } else {
      console.log("Printed InteractiveQuery:::", InteractiveQuery);
      let result = await query(InteractiveQuery);
      if (result.code) {
        logger.error("[getCampaignUsers][error]", result.code);
        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }
      logger.info("[getCampaignUsers][response]", {
        success: true,
        data: result,
      });
      res.json({ success: true, data: result });
    }
  } catch (error) {
    logger.error("[getCampaignUsers][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.addCampaign = async (req, res, next) => {
  logger.info("[addCampaign][body]", req.body);
  try {
    let list_upload_id = req.body.list_upload_id;
    const expectedKeys = [
      "start_date_time",
      "end_date_time",
      "campaign_type",
      "message",
      "lang",
      "title",
      "users_list",
      "description",
      "package_id",
      "menu_tree",
      "existing_menu",
      "priority",
      "forward_response",
      "endpoint",
      "black_list_group_id",
      "send_now",
    ];
    const hasKeys = Object.keys(req.body);
    const isLength = compareKeys(expectedKeys, hasKeys);
    if (!list_upload_id || isLength > 0) {
      logger.error("[addCampaign][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(422).json({ success: false, message: "Invalid Data" });
    }
    // await beginTransaction();
    const {
      start_date_time,
      end_date_time,
      campaign_type,
      message,
      lang,
      title,
      description,
      package_id,
      menu_tree,
      existing_menu,
      priority,
      forward_response,
      endpoint,
      black_list_group_id,
      send_now,
    } = req.body;
    var result =
      await query(`INSERT INTO campaigns (start_date, end_date, type, text, lang, status, title, description, package_id, priority, forward_response, endpoint,  send_now, user_id, black_list_group_id) 
    VALUES ('${start_date_time}', '${end_date_time}','${campaign_type}','${message}', '${lang}', '0', '${title}', '${description}', '${package_id}', ${priority}, ${
        forward_response == "true" ? 1 : 0
      }, '${endpoint}','${send_now == "true" ? 1 : 0}','${
        req.headers.enduser
      }', ${black_list_group_id} );`);
    if (req.file == undefined) {
      const checkTable = await query(
        `SELECT * FROM list_upload_${list_upload_id};`
      );
      if (checkTable.length) {
        const clone = await query(
          `CREATE TABLE list_${result.insertId} SELECT * FROM list_upload_${list_upload_id};`
        );
        let uploadedFileName = await query(
          `SELECT * FROM uploaded_list where id=${list_upload_id}`
        );
        const insertList = await query(
          `INSERT INTO list (count, title) VALUES ('${checkTable.length}','${uploadedFileName[0].name}');`
        );
        var list_id_inserted = await query(
          `UPDATE campaigns SET list_id='${insertList.insertId}' WHERE id=${result.insertId};`
        );
      }
      if (campaign_type == "2" && existing_menu == "0") {
        await createCampMenuTree(JSON.parse(menu_tree), result.insertId, res);
      }
      if (campaign_type == "2" && existing_menu !== "0") {
        await query(
          `UPDATE campaigns SET camp_menu_id=${existing_menu} WHERE id=${result.insertId}`
        );
      }
    } else {
      //const data = await getFileData(req);
      var list = await query(
        `INSERT INTO list (title) VALUES ('${req.file.originalname}');`
      );
      var table_created = await query(
        `CREATE TABLE IF NOT EXISTS list_${result.insertId} (
          msisdn        varchar(13)     unique        null,
          status        varchar(255) default '0' null,
          id int auto_increment primary key,
          user_response varchar(255)             null
              );`
      );

      let filePath = req.file.path;
      filePath = filePath.replace(/\\/g, "/");
      const list_inserted = await query(
        `LOAD DATA LOCAL INFILE '${filePath}'  INTO TABLE list_${result.insertId} FIELDS TERMINATED BY ','`
      );

      //delete duplicate
      let deleteFormat = await query(
        `delete from 
        ${result.insertId}  where id in
        (select min(id) from list_${result.insertId} group by REGEXP_SUBSTR(msisdn,"[0-9]+") having count(*) > 1);`
       );
      if (deleteFormat.code) {
        logger.error("[uploadList][error]", deleteFormat);
      }

      let updateFormat = await query(
        `update list_${result.insertId} set msisdn=REGEXP_SUBSTR(msisdn,"[0-9]+"),  status = '0';`
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
          `DELETE FROM list_${result.insertId} WHERE LENGTH(msisdn) not in (11,13);`
        );

      if (list_inserted.affectedRows) {
        const _result = await query(
          `Update list set count=${list_inserted.affectedRows} where id=${list.insertId}`
        );
        if (_result.code) {
          logger.error("[uploadList][error]", list_inserted);
          return res
            .status(400)
            .json({ success: false, message: _result.text });
        }
      }
      var list_id_inserted = await query(
        `UPDATE campaigns SET list_id='${list.insertId}' WHERE id=${result.insertId};`
      );
      if (campaign_type == "2" && existing_menu == "0") {
        await createCampMenuTree(JSON.parse(menu_tree), result.insertId, res);
      }
      if (campaign_type == "2" && existing_menu !== "0") {
        await query(
          `UPDATE campaigns SET camp_menu_id=${existing_menu} WHERE id=${result.insertId}`
        );
      }
      if (
        list.code ||
        table_created.code ||
        list_inserted.code ||
        list_id_inserted.code ||
        result.code
      ) {
        logger.error(
          "[addCampaign][error]",
          list.code ||
            table_created.code ||
            list_inserted.code ||
            list_id_inserted.code ||
            result.code
        );
        await rollbackCampaign(result.insertId, list.insertId);
        res.status(400).json({
          success: false,
          message: "Sorry could not insert the campaign details",
        });
      }
    }
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    logger.info("[addCampaign][response]", {
      success: true,
      message: "Campaign added successfully",
      data: result,
    });
    res.json({
      success: true,
      message: "Campaign added successfully",
      data: result,
    });
  } catch (error) {
    if (req.file) {
      logger.error("[addCampaign][error]", error);
      fs.unlinkSync(req.file.path);
      await rollbackCampaign(result.insertId, list.insertId);
    }
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateCampaign = async (req, res, next) => {
  logger.info("[updateCampaign][body]", req.body);
  let list_upload_id = req.body.list_upload_id;

  // const conn = await connection();
  // let { beginTransaction, commit, rollback, end } = conn;
  const expectedKeys = [
    "start_date_time",
    "end_date_time",
    "campaign_type",
    "message",
    "lang",
    "title",
    "description",
    "service_code",
    "priority",
    "black_list_group_id",
    "forward_response",
    "endpoint",
  ];
  const hasKeys = Object.keys(req.body);
  const isLength = compareKeys(expectedKeys, hasKeys);

  if (isLength > 0) {
    logger.error("[updateCampaign][error]", {
      success: false,
      message: "Invalid Data",
    });
    return res.status(422).json({ success: false, message: "Invalid Data" });
  }

  try {
    // await beginTransaction();
    const {
      start_date_time,
      end_date_time,
      message,
      title,
      description,
      priority,
      list_id,
      black_list_group_id,
      forward_response,
      endpoint,
    } = req.body;

    const result = await query(
      `UPDATE campaigns SET start_date='${start_date_time}', end_date='${end_date_time}', text='${message}', title='${title}', priority=${priority} ,description='${description}', black_list_group_id=${black_list_group_id}, endpoint='${endpoint}', forward_response=${
        forward_response == "true" ? 1 : 0
      } WHERE id = ${req.params.id};`
    );

    if (list_id !== "null") {
      let data;
      if (req.file) {
        data = await getFileData(req);

        const table_trunc = await query(
          `TRUNCATE TABLE list_${req.params.id};`
        );

        let filePath = req.file.path;
        filePath = filePath.replace(/\\/g, "/");

        const list_inserted = await query(
          `LOAD DATA LOCAL INFILE '${filePath}'  INTO TABLE list_${req.params.id} FIELDS TERMINATED BY ','`
        );

        await query(
          `update list_${req.params.id} set msisdn=REGEXP_SUBSTR(msisdn,"[0-9]+"), status='0';`
        );

        // await query(`UPDATE list_${req.params.id} SET status='0';`);

        const list = await query(
          `Update list set count=${list_inserted.affectedRows}, title='${req.file.originalname}' WHERE id=${list_id} `
        );
      } else {
        const uploadedList = await query(
          `SELECT * FROM list_upload_${list_upload_id};`
        );

        let tableData = [];

        for (let val = 0; val < uploadedList.length; val++) {
          tableData.push(`(${uploadedList[val].msisdn})`);
        }

        let uploadedFileName = await query(
          `SELECT * FROM uploaded_list where id=${list_upload_id}`
        );

        const list = await query(
          `Update list set count=${uploadedList.length}, title='${uploadedFileName[0].name}' WHERE id=${list_id} `
        );

        const table_trunc = await query(
          `TRUNCATE TABLE list_${req.params.id};`
        );

        const inserted_list = await query(
          `INSERT INTO list_${req.params.id} (msisdn) VALUES ${tableData};`
        );
      }
    }

    if (result.code) {
      logger.error(
        "[updateCampaign][error]",
        result.code ||
          created_table.code ||
          table_trunc.code ||
          inserted_list.code ||
          list.code
      );

      // await rollback();
      return res
        .status(422)
        .json({ success: false, message: "Sorry something went wrong" });
    }

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    // await commit();
    // await end();

    logger.info("[updateCampaign][response]", {
      success: true,
      message: "Campaign updated successfully",
    });

    res.json({
      success: true,
      message: "Campaign updated successfully",
    });
  } catch (error) {
    logger.error("[updateCampaign][error]", error);
    // await rollback();
    res.status(500).json({ success: false, error: error });
  }
};

exports.getCampMenu = async (req, res, next) => {
  try {
    logger.info("[getCampMenu][params]", req.params);

    let getTree = await getMenuTree(req.params.id);

    // if (getTree.code) {
    //   logger.error("[getCampMenu][error]", getTree);

    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Invalid Query/Data!" });
    // }

    logger.info("[getCampMenu][response]", getTree);

    res.json(getTree);
  } catch (error) {
    logger.error("[getCampMenu][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};
exports.getCampEsmeNames = async (req, res, next) => {
  try {
    logger.info("[getCampEsmeNames][params]", req.params);

    let esmeNames = await getCampEsmeNames();

    logger.info("[getCampEsmeNames][response]", esmeNames);

    res.json(esmeNames);
  } catch (error) {
    logger.error("[getCampEsmeNames][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getAllCampTree = async (req, res, next) => {
  try {
    logger.info("[getAllCampTree][controller]");

    let result = await query(`SELECT * FROM campaign_menu`);

    if (result.code) {
      logger.error("[getAllCampTree][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid query syntax" });
    }

    logger.info("[getAllCampTree][response]", { success: true, data: result });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getAllCampTree][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getMsisdnCampaignHistory = async (req, res, next) => {
  try {
    logger.info("[getMsisdnCampaignHistory][controller]");

    let result = await query(
      `SELECT * FROM campaign_history where msisdn=${req.params.id}`
    );

    if (result.code) {
      logger.error("[getMsisdnCampaignHistory][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid query syntax" });
    }

    logger.info("[getMsisdnCampaignHistory][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getMsisdnCampaignHistory][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateCampaignStatus = async (req, res, next) => {
  try {
    logger.info("[updateCampaignStatus][params]", req.params);

    let { id, status } = req.params;

    if (status == -200) {
      var cancelCampaign = await query(
        `UPDATE campaigns SET status=${status} WHERE id=${id};`
      );

      if (cancelCampaign.code) {
        logger.error("[updateCampaignStatus][error]", cancelCampaign);
        return res
          .status(400)
          .json({ success: false, message: "Invalid query syntax" });
      }

      logger.info("[updateCampaignStatus][response]", {
        success: true,
        data: response.data,
      });
      res.status(200).json({ success: true, data: cancelCampaign });
    }

    let response = campStatusUpdate(id, status);

    if (response.code) {
      logger.error("[updateCampaignStatus][error]", response);
      return res
        .status(400)
        .json({ success: false, message: "Invalid query syntax" });
    }

    logger.info("[updateCampaignStatus][response]", {
      success: true,
      data: response.data,
    });
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    logger.error("[updateCampaignStatus][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

createCampMenuTree = async (menu_tree, id, res) => {
  try {
    var camp_menu_tree = await query(
      `INSERT INTO campaign_menu (menu_title) VALUES ('${menu_tree.camp_menu_name}');`
    );

    //
    var campaign_id_add = await query(
      `UPDATE campaigns SET camp_menu_id=${camp_menu_tree.insertId} WHERE id=${id};`
    );

    var add_camp_tree = await addMenuTree(
      menu_tree,
      camp_menu_tree.insertId,
      menu_tree.camp_menu_name
    );

    if (camp_menu_tree.code || campaign_id_add.code) {
      logger.error(
        "[createCampMenuTree][error]",
        camp_menu_tree.code || campaign_id_add.code
      );

      return res
        .status(400)
        .json({ success: false, message: "Invalid query syntax" });
    }

    return add_camp_tree;
  } catch (error) {
    logger.error("[createCampMenuTree][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getCampaignUnits = async (req, res, next) => {
  try {
    logger.info("[getCampaignUnits][controller]");

    const result = await query(`SELECT * FROM transaction_units`);
    if (result.code) {
      logger.error("[getCampaignUnits][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getCampaignUnits][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getCampaignUnits][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    logger.info("[getAllUser][controller]");

    const result = await query(`SELECT * FROM user_quota`);
    if (result.code) {
      logger.error("[getAllUser][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getAllUser][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getAllUser][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.findByMsisdn = async (req, res, next) => {
  try {
    logger.info("[findByMsisdn][query]", req.query);

    const result = await query(`SELECT id FROM campaigns`);
    if (result.code) {
      logger.error("[findByMsisdn][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    listIds = [];

    listIds = [];
    for (let obj of result) {
      const result2 = await query(
        `SELECT if(msisdn=${
          req.query.msisdn
        },${true},${false}) AS output FROM list_${obj.id} WHERE  msisdn LIKE '${
          req.query.msisdn
        }%';`
      );

      if (result2.length > 0) {
        listIds.push(obj.id);
      }
    }

    if (listIds.length == 0) {
      {
        logger.error("[findByMsisdn][error]", result);

        return res.status(404).json({
          success: false,
          message: "No campaign exist agianst provided number",
        });
      }
    }

    const result3 = await query(
      `SELECT * FROM campaigns WHERE id IN (${listIds.toString()}) AND type=${
        req.query.type
      } AND user_id='${req.headers.enduser}'`
    );

    for (data of result3) {
      let allStatus = await query(
        `select count(*) as count from list_${data.id}`
      );
      let status = await query(
        `select count(*) as count from list_${data.id} where status=100`
      );

      let percentage = (status[0].count / allStatus[0].count) * 100;

      Object.assign(data, { progress: Math.trunc(percentage) });
    }

    logger.info("[findByMsisdn][response]", {
      success: true,
      data: result3,
    });

    res.status(200).json({ success: true, data: result3 });
  } catch (error) {
    logger.error("[findByMsisdn][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.campaignResponse = async (req, res) => {
  try {
    let { msisdn, timestamp, body } = req.body;

    if (!msisdn || !timestamp || !body) {
      logger.error("[campaignResponse][error]", {
        success: false,
        message: "Invalid Data",
      });

      return res.status(422).json({ success: false, message: "Invalid Data" });
    }

    body = JSON.stringify(body);
    var result =
      await query(`INSERT INTO campaign_responses (msisdn, timestamp, body) 
    VALUES ('${msisdn}', '${timestamp}', '${body}');`);

    logger.info("[campaignResponse][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[campaignResponse][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
