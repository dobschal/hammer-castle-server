const config = require("../config");
const tool = require("../lib/tool");
const db = require("../lib/database");
const websocket = require("./websocketService");

/**
 * @param {Position} position
 * @param {string} type
 * @return {BlockAreaDto}
 */
function createBlockArea(position, type = "FOREST") {
    position.y = Math.round(position.y);
    position.x = Math.round(position.x);
    db.prepare(`INSERT INTO block_area (x, y, size, type)
                VALUES (?, ?, ?, ?);`)
        .run(position.x, position.y, config.BLOCK_AREA_SIZE, type);
    const blockArea = getOne(position);
    websocket.broadcast("NEW_BLOCK_AREA", blockArea);
    return blockArea;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @return {BlockAreaDto}
 */
function getOne({x, y}) {
    return db.prepare(`
        SELECT *
        FROM block_area
        WHERE block_area.x = ?
          AND block_area.y = ?;
    `).get(x, y);
}

/**
 * @param {CastleDto} aroundCastle
 * @param {CastleDto[]} castlesInDistance
 */
function createRandomBlockArea(aroundCastle, castlesInDistance) {

    const distanceFromCastle = Math.floor(config.MIN_CASTLE_DISTANCE + config.MAX_CASTLE_DISTANCE / 2);

    // Get a random point on a circle around the castle and check if no existing castle is in the way...
    const randomAngle = Math.random() * Math.PI * 2;
    const x = Math.floor(distanceFromCastle * Math.cos(randomAngle) + aroundCastle.x);
    const y = Math.floor(distanceFromCastle * Math.sin(randomAngle) + aroundCastle.y);
    console.log("[blockArea] New block area at: ", x, y);

    // Is existing castle inside new block area?
    const c = castlesInDistance.some(c => tool.positionDistance({x, y}, c) < config.BLOCK_AREA_SIZE);
    if (c) {
        console.log("[blockArea] Castle inside new block area, so skip... ", c);
    } else {
        const closedBlockAreas = getBlockAreasInDistance({x, y}, config.BLOCK_AREA_SIZE * 2);
        console.log("[blockArea] Close areas: ", closedBlockAreas);
        if (closedBlockAreas.length === 0) {
            const blockArea = createBlockArea({x, y}, Math.random() >= 0.5 ? "FOREST" : "MOUNTAIN");
            console.log("[blockArea] Created new block area!: ", blockArea);
            return blockArea;
        }
    }
}

/**
 * @param {Position} position
 * @param {number} maxDistance
 * @return {BlockAreaDto[]}
 */
function getBlockAreasInDistance(position, maxDistance) {
    const minX = position.x - maxDistance;
    const maxX = position.x + maxDistance;
    const minY = position.y - maxDistance;
    const maxY = position.y + maxDistance;
    const sqlQuery = `
        SELECT *
        FROM block_area
        WHERE block_area.x <= ?
          AND block_area.x >= ?
          AND block_area.y <= ?
          AND block_area.y >= ?;
    `;
    return db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
}

/**
 * @return {BlockAreaDto[]}
 */
function getAll() {
    return db.prepare(`
        SELECT *
        FROM block_area;
    `).all();
}

/**
 * @param {Position} position
 */
function isInsideBlockArea(position) {
    const minX = position.x - config.BLOCK_AREA_SIZE;
    const maxX = position.x + config.BLOCK_AREA_SIZE;
    const minY = position.y - config.BLOCK_AREA_SIZE;
    const maxY = position.y + config.BLOCK_AREA_SIZE;
    const sqlQuery = `
        SELECT *
        FROM block_area
        WHERE block_area.x <= ? AND block_area.x >= ? AND block_area.y <= ? AND block_area.y >= ?;
    `;
    const result = db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
    if(!result || !result.length) return false;
    return result.some(blockArea => tool.positionDistance(blockArea, position) < config.BLOCK_AREA_SIZE);
}

module.exports = {createRandomBlockArea, getAll, isInsideBlockArea};
