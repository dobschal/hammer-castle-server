const config = require("../config");
const tool = require("../lib/tool");
const db = require("../lib/database");

/**
 * @param {CastleDto} aroundCastle
 * @param {CastleDto[]} castlesInDistance
 */
function createBlockArea(aroundCastle, castlesInDistance) {

    // Get a random point on a circle around the castle and check if no existing castle is in the way...
    const randomAngle = Math.random() * Math.PI * 2;
    const x = Math.floor(config.BLOCK_AREA_SIZE * Math.cos(randomAngle) + aroundCastle.x);
    const y = Math.floor(config.BLOCK_AREA_SIZE * Math.sin(randomAngle) + aroundCastle.y);
    console.log("[blockArea] New block area at: ", x, y);

    // Is existing castle inside new block area?
    const c = castlesInDistance.some(c => tool.positionDistance({x, y}, c) < config.BLOCK_AREA_SIZE);
    if (c) {
        console.log("[blockArea] Castle inside new block area, so skip... ", c);
    } else {

    }
}

module.exports = {createBlockArea};
