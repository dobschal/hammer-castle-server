const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(`UPDATE castle
                SET x = ROUND(x),
                    y = ROUND(Y)`).run();
    db.prepare(`UPDATE knight
                SET x = ROUND(x),
                    y = ROUND(Y)`).run();
    db.prepare(`UPDATE knight
                SET goToX = ROUND(goToX),
                    goToY = ROUND(goToY)
                WHERE goToX IS NOT NULL
                  AND goToY IS NOT NULL `).run();
    db.prepare(`UPDATE warehouse
                SET x          = ROUND(x),
                    y          = ROUND(Y),
                    castle_1_x = ROUND(castle_1_x),
                    castle_1_y = ROUND(castle_1_y),
                    castle_2_x = ROUND(castle_2_x),
                    castle_2_y = ROUND(castle_2_y)`).run();
    db.prepare(`UPDATE block_area
                SET x = ROUND(x),
                    y = ROUND(Y)`).run();
    db.prepare(`UPDATE action_log
                SET x = ROUND(x),
                    y = ROUND(Y)`).run();
    db.prepare(`UPDATE catapult
                SET x                 = ROUND(x),
                    y                 = ROUND(Y),
                    opponent_castle_x = ROUND(opponent_castle_x),
                    opponent_castle_y = ROUND(opponent_castle_y),
                    user_castle_x     = ROUND(user_castle_x),
                    user_castle_y=ROUND(user_castle_y)`).run();
    db.prepare(`UPDATE conquer
                SET castleX = ROUND(castleX),
                    castleY = ROUND(castleY)`).run();
    db.prepare(`UPDATE user
                SET startX = ROUND(startX),
                    startY = ROUND(startY)`).run();
    db.prepare(`UPDATE user_castle_points
                SET castleX = ROUND(castleX),
                    castleY = ROUND(castleY)`).run();

};
