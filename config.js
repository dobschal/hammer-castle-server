module.exports = {
  TOKEN_EXPIRATION: 1000 * 60 * 60 * 24,
  MIN_CASTLE_DISTANCE: 200, // needs to be the same as in client!!!
  MAX_CASTLE_DISTANCE: 300,
  CONQUER_DELAY: 1000 * 60 * 5,
  BLOCK_AREA_SIZE: 150, // Radius!, should be max castle distance
  MAX_HAMMERS: 3600,
  MAKE_HAMMER_INTERVAL: 1000 * 10,
  DETECT_CONQUER_INTERVAL: 1000 * 2,
  DETECT_CATAPULT_ATTACK_INTERVAL: 1000 * 2,
  CASTLE_CLEAN_UP_INTERVAL: 1000 * 60,
  CATAPULT_LIFETIME: 1000 * 60 * 5 // needs to be the same as in client!!!
};
