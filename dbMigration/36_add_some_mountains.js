const db = require("../lib/database");

module.exports = function() {
    db.prepare(`update block_area set type='MOUNTAIN' where (ROWID%2)=0;`).run();
};
