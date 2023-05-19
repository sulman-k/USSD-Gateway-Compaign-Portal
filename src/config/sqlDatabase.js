const mariadb = require("mariadb");
const moduleName = "[sqlDatabase]",
    logger = require(`${__utils}/logger/logger`)(moduleName);

const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.PORT,
    permitLocalInfile: true,
    connectionLimit: 100,
});

exports.query = async(query) => {
    let connection;
    let promise = await new Promise(async(resolve, reject) => {
        connection = await pool.getConnection();
        // console.log("Query: ", query);
        try {
            logger.info("[query]", query);

            const res = await connection.query(query, [1, "mariadb"]);
            logger.info("[query][result]", res);

            connection.end();
            resolve(res);
        } catch (error) {
            logger.error("[query][error]", error);
            connection.end();

            reject(error);
        }
    });

    return promise;
};