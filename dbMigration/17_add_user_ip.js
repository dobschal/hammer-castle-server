const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS user_ip
             (
                 user_id   INTEGER      NOT NULL,
                 ip        VARCHAR(255) NOT NULL,
                 timestamp INTEGER      NOT NULL
             );`
    ).run();

};
