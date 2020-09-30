const db = require("../lib/database");

module.exports = class Repository {

    constructor(name) {
        this.name = name;
    }

    save(object) {
        const {count} = db.prepare("SELECT COUNT(*) as count FROM " + this.name + " WHERE id=?;").get(object.id);
        console.log("[BaseRepository] Found item?: ", count);
        if (count === 1) {

        } else if (count === 0) {

        } else {
            throw new Error("Duplicated key entry in database!");
        }
    }
};
