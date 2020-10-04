const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {
    db.prepare(
        `CREATE TABLE IF NOT EXISTS forum_category
             (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name VARCHAR(255) NOT NULL,
                 description TEXT
             );`
    ).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS forum_entry
             (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 category_id INTEGER NOT NULL,
                 user_id INTEGER NOT NULL,
                 content TEXT NOT NULL,
                 timestamp INTEGER NOT NULL
             );`
    ).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS forum_entry_likes
             (
                 entry_id INTEGER NOT NULL,
                 user_id INTEGER NOT NULL,
                 timestamp INTEGER NOT NULL
             );`
    ).run();
};
