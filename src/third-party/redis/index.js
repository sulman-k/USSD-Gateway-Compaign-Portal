const moduleName = "[Redis]",
  _ = require("underscore"),
  _this = this,
  async = require("async"),
  OTPUserModel = require(`${__models}/otp-users`).model,
  logger = require(`${__utils}/logger/logger`)(moduleName),
  config = require(`${__config}/config`),
  { promisify } = require("util");

exports.setSortedSet = async (key, val) => {
  logger.info("[setSortedSet][key][val]", `${key}${val}`);
  const sadd_async = promisify(RedisClient.sadd).bind(RedisClient);
  await sadd_async(key, val);
  logger.info("[setSortedSet][Success]");
};

exports.getSortedSetMembers = async (key) => {
  logger.info("[getSortedSetMembers][key]", `${key}`);

  const smembers_async = promisify(RedisClient.smembers).bind(RedisClient);
  let data = await smembers_async(key);

  logger.info("[getSortedSetMembers][Success]");
  return { success: true, data: data };
};

exports.hashMapSet = async (key, field, val) => {
  logger.info(
    "[hashMapSet][key][field][val]",
    `${key} ${field} ${JSON.stringify(val)}`
  );
  const hmset_async = promisify(RedisClient.hmset).bind(RedisClient);

  val = _.isBoolean(val) ? val : val ? val : "";
  await hmset_async(key, field, val);

  // To handle hash map key, save hash map key against uuid in sorted set
  if (field === "uuid") {
    await this.setSortedSet(`${config.REDIS.USER_IDENTIFIER}${val}`, key);
  }

  logger.info("[hashMapSet][Success]");
};

exports.deleteHashMapSet = async (key, field) => {
  logger.info("[deleteHashMapSet][key][field]", `${key} ${field}`);
  const del_async = promisify(RedisClient.del).bind(RedisClient);

  await del_async(key, field);
  logger.info("[deleteHashMapSet][Success]");
};
exports.deleteKey = async (key) => {
  logger.info("[deleteKey][key]", key);

  const del_async = promisify(RedisClient.del).bind(RedisClient);
  await del_async(key);

  logger.info("[deleteKey][Success]");
};

exports.getHashMap = async (key, field) => {
  logger.info("[getHashMap][key][field]", `${key} ${field}`);

  const hmget_async = promisify(RedisClient.hmget).bind(RedisClient);

  let data = await hmget_async(key, field);

  logger.info("[getHashMap][Success]");
  return { success: true, data: data };
};

exports.getAllHashMap = async (key) => {
  logger.info("[getAllHashMap][key][field]", `${key}`);

  const hgetall_async = promisify(RedisClient.hgetall).bind(RedisClient);

  let data = await hgetall_async(key);

  logger.info("[getAllHashMap][Success]");
  return { success: true, data: data };
};

exports.prepareRecord = async (key, obj) => {
  logger.info("[prepareRecord][key][obj]", `${key} ${JSON.stringify(obj)}`);
  const keys = Object.keys(obj);

  for (const s_key of keys) {
    await this.hashMapSet(key, s_key, obj[s_key]);
  }

  logger.info("[prepareRecord][Success]");
};

exports.getRecordKey = async (obj) => {
  logger.info("[getRecordKey][obj]", `${JSON.stringify(obj)}`);
  let data = await this.getSortedSetMembers(
    `${config.REDIS.USER_IDENTIFIER}${obj.uuid}`
  );

  logger.info(
    "[getSortedSetMembers][callback][data]",
    `${JSON.stringify(data)}`
  );
  if (data.success) {
    return data.data ? data.data[data.data.length - 1] : null;
  }
  return null;
};

exports.dataFROMRTOM = async (records) => {
  logger.info(`[Total][Records][For][Insertion],  ${records.length}`);

  if (_.isEmpty(records)) {
    return;
  }

  const finalRecords = records.map((record) => {
    const {
      id,
      user,
      model,
      OS,
      device,
      brand,
      manufacturer,
      bootloader,
      display,
      host,
      hardware,
      board,
      imei,
      operator_name,
      country,
      sim_serial_number,
    } = record;

    if ("error_code" in record && "error_message" in record) {
      record["error"] = {
        code: record.error_code,
        message: record.error_message,
      };
    }
    record["device_detail"] = {
      id,
      user,
      model,
      OS,
      device,
      brand,
      manufacturer,
      bootloader,
      display,
      host,
      hardware,
      board,
      imei,
      operator_name,
      country,
      sim_serial_number,
    };
    record = _.omit(record, [
      "error_code",
      "error_message",
      "id",
      "user",
      "model",
      "OS",
      "device",
      "brand",
      "manufacturer",
      "bootloader",
      "display",
      "host",
      "hardware",
      "board",
      "imei",
      "operator_name",
      "country",
      "sim_serial_number",
    ]);
    return record;
  });

  await OTPUserModel.insertMany(finalRecords);
};

exports.dataDumpScheduler = async (pattern) => {
  let HASH_MAP_KEYS = [],
    SET_KEYS = [],
    MONGODB_RECORDS = [];

  // Scan Redis Data for records
  const scan_async = promisify(RedisClient.scan).bind(RedisClient);
  let data = await scan_async(
    0,
    "MATCH",
    pattern,
    "COUNT",
    config.REDIS.SCAN_RECORDS_COUNT
  );

  if (!_.isEmpty(data)) {
    SET_KEYS = data[1];
  } else {
    logger.warn("[NotFound]", "In scan_async call");
  }

  // Get data from sorted sets
  logger.warn("Get data from sorted sets", SET_KEYS.length);
  for (const SET_KEY of SET_KEYS) {
    let results = await this.getSortedSetMembers(SET_KEY);

    if (results.success) {
      HASH_MAP_KEYS = [...HASH_MAP_KEYS, ...results["data"]];
    } else {
      // if results.success = false ?
      logger.warn("[NotFound]", "In getSortedSetMembers call");
    }
  }

  // Get data from hash maps keys
  logger.warn("Get data from hash maps keys", HASH_MAP_KEYS.length);
  for (const HASH_MAP_KEY of HASH_MAP_KEYS) {
    let results = await this.getAllHashMap(HASH_MAP_KEY);

    if (results.success) {
      console.log("Data for Mongodb", results.data);
      MONGODB_RECORDS.push(results.data);
    } else {
      // if results.success = false ?
      logger.warn("[NotFound]", "In getAllHashMap call");
    }
  }

  // Preparing sorted sets for deletion
  logger.warn("Preparing sorted sets for deletion", SET_KEYS.length);
  for (const key of SET_KEYS) {
    await this.setSortedSet(config.REDIS.DELETE_READY_QUEUE, key);
  }

  // Preparing hash maps for deletion
  logger.warn("Preparing hash maps for deletion", HASH_MAP_KEYS.length);
  for (const key of HASH_MAP_KEYS) {
    await this.setSortedSet(config.REDIS.DELETE_READY_QUEUE, key);
  }

  //  Deleting Dumped Keys
  logger.warn("Deleting Dumped Keys");
  let results = await this.getSortedSetMembers(config.REDIS.DELETE_READY_QUEUE);
  if (results.success) {
    for (const key of results["data"]) {
      await this.deleteKey(key);
    }

    // Delete delete_ready_queue as well from redis
    await this.deleteKey(config.REDIS.DELETE_READY_QUEUE);
  } else {
    // if results.success = false ?
    logger.warn("[NotFound]", "In getSortedSetMembers For Delete Call");
  }

  // Dump Data
  logger.warn("Running Data Dump");
  await this.dataFROMRTOM(MONGODB_RECORDS);
};
