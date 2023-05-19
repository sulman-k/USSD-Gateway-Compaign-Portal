const { connection } = require("../config/sqlDatabase");
console.log(connection);
async function resolvePromise() {
    const conn =await connection();
    console.log(conn);

}
resolvePromise();
let { beginTransaction, commit, rollback, end } = conn;
exports.beginTransaction = beginTransaction;