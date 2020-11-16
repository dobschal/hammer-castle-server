console.log("[config] Is Development: ", Boolean(process.env.IS_DEV));

const isDev = Boolean(process.env.IS_DEV);

module.exports = {

    MAX_FARM_RESOURCES_HOURS: 3, // clip after 3 hours of gathering
    BLOCK_AREA_SIZE: 200, // Radius!, should be max castle distance

    // - - - - - - - - - - - - Security - - - - - - - - - - - - //

    TOKEN_EXPIRATION: 1000 * 60 * 60 * 24,
    USERS_PER_IP: 3,

    // - - - - - - - - - - - - Scheduler Intervals - - - - - - - - - - - - //

    DETECT_CONQUER_INTERVAL: 1000,
    MOVE_KNIGHTS_INTERVAL: 1000 * 2,
    DETECT_CATAPULT_ATTACK_INTERVAL: 1000 * 2,
    WAREHOUSE_CLEAN_UP_INTERVAL: 1000 * 2,
    USER_CLEAN_UP_INTERVAL: 1000 * 10,
    CHARGE_KNIGHTS_INTERVAL: 1000 * 60,
    MAKE_RESOURCES_INTERVAL: 1000 * 10,

    // - - - - - - - - - - - - Catapult - - - - - - - - - - - - //

    CATAPULT_LIFETIME: 1000 * 60 * 5, // needs to be the same as in client!!!

    // - - - - - - - - - - - - Knights - - - - - - - - - - - - //

    KNIGHT_PRICE: 5000,
    KNIGHT_BEER_COST_PER_LEVEL: 6,
    KNIGHT_MOVE_DURATION: isDev ? 1000 * 5 : 1000 * 60 * 15,

    // - - - - - - - - - - - - Events - - - - - - - - - - - - //

    EVENTS: {
        USER_CONNECTED: "USER_CONNECTED",
        CASTLE_DESTROYED: "CASTLE_DESTROYED",
        CASTLE_CREATED: "CASTLE_CREATED",
        CASTLE_CONQUERED: "CASTLE_CONQUERED",
        CASTLE_POINTS_CHANGED: "CASTLE_POINTS_CHANGED",
        KNIGHT_MOVED: "KNIGHT_MOVED",
        KNIGHT_CREATED: "KNIGHT_CREATED",
        KNIGHT_DESTROYED: "KNIGHT_DESTROYED"
    },

    // - - - - - - - - - - - - Castles - - - - - - - - - - - - //

    CONQUER_DELAY: isDev ? 1000 * 5 : 1000 * 60 * 5,
    AVERAGE_POINTS_PER_CASTLE: 3.75, // necessary for price calculation. The higher the value, the more complicated to play.
    MIN_CASTLE_DISTANCE: 200, // needs to be the same as in client!!!
    MAX_CASTLE_DISTANCE: 300,
    CASTLE_NAMES: [
        "Adamant",
        "Amber",
        "Bunthorne",
        "Duckula",
        "Krystalo",
        "Grayskull",
        "Wyvern",
        "Eichenwalde",
        "Hagedorn",
        "Ravenloft",
        "Schwarzwald",
        "Eyrie",
        "Pyke",
        "Winterfell",
        "Anvard",
        "Eneyr",
        "Hemma",
        "Tirith",
        "Barad-dùr",
        "Amon",
        "Hyrule",
        "Greenhill",
        "Maetrine",
        "Barkhasmted",
        "Baston",
        "Bordium",
        "Portam",
        "Marshwood",
        "Harding",
        "Earlton",
        "Scarwood",
        "Plympford",
        "Falkerstone",
        "Darthill",
        "Bargsea"
    ]
};
