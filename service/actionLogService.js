const websocket = require("./websocket");
const db = require("../lib/database");

module.exports = {

    /**
     * @param {string} content
     * @param {string} username
     * @param {number} user_id
     */
    save(content, user_id, username) {
        const timestamp = Date.now();
        const {lastInsertRowid: id} = db.prepare("INSERT INTO action_log (timestamp, content, user_id) VALUES (?,?,?)").run(timestamp, content, user_id);
        if (!username) {
            const {username2} = db.prepare("SELECT username as username2 FROM user WHERE id=?").get(user_id);
            username = username2;
        }
        if (websocket.connections[username]) {
            websocket.connections[username].emit("NEW_ACTION_LOG", {
                user_id, timestamp, content, id
            });
        }
    },

    /**
     * @param {User} user
     */
    getAllOfUser(user) {
        return db.prepare("SELECT * FROM action_log WHERE user_id=?;").all(user.id);
    }
};
