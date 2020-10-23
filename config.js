module.exports = {
    TOKEN_EXPIRATION: 1000 * 60 * 60 * 24,
    MIN_CASTLE_DISTANCE: 200, // needs to be the same as in client!!!
    MAX_CASTLE_DISTANCE: 300,
    CONQUER_DELAY: 1000 * 60 * 5,
    BLOCK_AREA_SIZE: 200, // Radius!, should be max castle distance
    DETECT_CONQUER_INTERVAL: 1000 * 2,
    DETECT_CATAPULT_ATTACK_INTERVAL: 1000 * 2,
    CASTLE_CLEAN_UP_INTERVAL: 1000 * 60,
    WAREHOUSE_CLEAN_UP_INTERVAL: 1000 * 2,
    USER_CLEAN_UP_INTERVAL: 1000 * 10,
    CATAPULT_LIFETIME: 1000 * 60 * 5, // needs to be the same as in client!!!

    MAKE_HAMMER_INTERVAL: 1000 * 10,
    AVERAGE_POINTS_PER_CASTLE: 3.75, // necessary for price calculation. The higher the value, the more complicated to play.
    MAX_HAMMER_HOURS: 3, // clip after 3 hours of gathering
    KNIGHT_PRICE: 5000,

    USERS_PER_IP: 3,

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
