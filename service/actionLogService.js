const websocket = require("./websocketService");
const db = require("../lib/database");

module.exports = {

    /**
     * @param {string} content
     * @param {string} username
     * @param {number} user_id
     * @param {number} x
     * @param {number} y
     * @param {string} type
     */
    save(content, user_id, username, {x, y}, type = "UNKNOWN") {
        const timestamp = Date.now();
        const {lastInsertRowid: id} = db
            .prepare("INSERT INTO action_log (`timestamp`, content, user_id, x, y, type) VALUES (@timestamp, @content, @user_id, @x, @y, @type)")
            .run({timestamp, content, user_id, x, y, type});
        if (!username) {
            const {username2} = db.prepare("SELECT username as username2 FROM user WHERE id=?").get(user_id);
            username = username2;
        }
        if (websocket.connections[username]) {
            websocket.connections[username].emit("NEW_ACTION_LOG", {timestamp, content, user_id, x, y, type, id});
        }
    },

    /**
     * @param {UserEntity} user
     */
    getAllOfUser(user) {
        return db.prepare("SELECT * FROM action_log WHERE user_id=?;").all(user.id);
    }
};
