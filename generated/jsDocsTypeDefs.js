/**
 * @typedef Position
 * @type {object}
 * @property {number} x - required
 * @property {number} y - required
 */
/**
 * @typedef UserTokenBody
 * @type {object}
 * @property {undefined} expires - required
 * @property {undefined} username - required
 * @property {undefined} userRoles - required
 * @property {undefined} id - required
 */
/**
 * @typedef CastlePointsEntity
 * @type {object}
 * @property {number} castleX
 * @property {number} castleY
 * @property {number} userId
 * @property {number} points
 */
/**
 * @typedef CatapultEntity
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} opponent_castle_x
 * @property {number} opponent_castle_y
 * @property {number} user_castle_x
 * @property {number} user_castle_y
 * @property {number} user_id
 * @property {number} lifetime
 * @property {string} timestamp
 * @property {string} color
 * @property {string} username
 * @property {number} chance_to_win
 */
/**
 * @typedef ConquerEntity
 * @type {object}
 * @property {number} castleX
 * @property {number} castleY
 * @property {number} userId
 * @property {number} startedAt
 */
/**
 * @typedef ForumCategoryEntity
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {string} description
 */
/**
 * @typedef ForumEntryEntity
 * @type {object}
 * @property {number} id
 * @property {number} categoryId
 * @property {string} content
 * @property {number} timestamp
 * @property {string} color
 * @property {string} username
 * @property {number} userId
 */
/**
 * @typedef FriendEntity
 * @type {object}
 * @property {number} id
 * @property {number} userAId
 * @property {number} userBId
 */
/**
 * @typedef KnightEntity
 * @type {object}
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {number} goToX
 * @property {number} goToY
 * @property {number} arrivesAt
 * @property {number} level
 * @property {number} userId
 * @property {string} name
 */
/**
 * @typedef UserEntity
 * @type {object}
 * @property {number} id
 * @property {string} username - required
 * @property {string} password
 * @property {string} timestamp
 * @property {string} email
 * @property {number} email_verified
 * @property {string} color
 * @property {number} startX
 * @property {number} startY
 * @property {number} hammer
 * @property {number} hammer_per_minute
 * @property {number} level
 * @property {number} max_hammers
 * @property {number} last_active_at
 * @property {number} last_daily_reward_claim
 * @property {number} beer
 * @property {number} max_beer
 */
/**
 * @typedef WarehouseEntity
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} castle_1_x
 * @property {number} castle_1_y
 * @property {number} castle_2_x
 * @property {number} castle_2_y
 * @property {number} user_id
 * @property {string} timestamp
 * @property {string} color
 * @property {string} username
 */
/**
 * @typedef AddFriendRequest
 * @type {object}
 * @property {string} username - required
 */
/**
 * @typedef ChangeCastleNameRequest
 * @type {object}
 * @property {string} name
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef CreateCastleRequest
 * @type {object}
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef CreateCatapultRequest
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} opponentCastleX
 * @property {number} opponentCastleY
 * @property {number} userCastleX
 * @property {number} userCastleY
 */
/**
 * @typedef CreateCategoryRequest
 * @type {object}
 * @property {string} name - required
 * @property {string} description - required
 */
/**
 * @typedef CreateForumEntryRequest
 * @type {object}
 * @property {number} categoryId - required
 * @property {string} content - required
 */
/**
 * @typedef CreateWarehouseRequest
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} castle1X
 * @property {number} castle1Y
 * @property {number} castle2X
 * @property {number} castle2Y
 */
/**
 * @typedef DeleteCastleRequest
 * @type {object}
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef FindUserRequest
 * @type {object}
 * @property {string} query
 */
/**
 * @typedef MoveKnightRequest
 * @type {object}
 * @property {number} x - required
 * @property {number} y - required
 * @property {number} knightId - required
 */
/**
 * @typedef UpdateCategoryRequest
 * @type {object}
 * @property {number} id - required
 * @property {string} name - required
 * @property {string} description - required
 */
/**
 * @typedef UpgradeWarehouseRequest
 * @type {object}
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef UserRequest
 * @type {object}
 * @property {string} username - required
 * @property {string} password - required
 * @property {string} color
 */
/**
 * @typedef BlockAreaDto
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} size
 * @property {string} type
 */
/**
 * @typedef CastleDtoPointsPerUser
 * @type {object}
 */
/**
 * @typedef CastleDto
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} userId
 * @property {number} points
 * @property {string} color
 * @property {string} username
 * @property {string} name
 * @property {CastleDtoPointsPerUser} pointsPerUser
 */
/**
 * @typedef ConquerDtoCastlePointsPerUser
 * @type {object}
 */
/**
 * @typedef ConquerDtoCastle
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} userId
 * @property {number} points
 * @property {string} color
 * @property {string} username
 * @property {string} name
 * @property {ConquerDtoCastlePointsPerUser} pointsPerUser
 */
/**
 * @typedef ConquerDto
 * @type {object}
 * @property {number} userId
 * @property {ConquerDtoCastle} castle
 * @property {number} timestamp
 */
/**
 * @typedef UserPointsDto
 * @type {object}
 * @property {number} userId
 * @property {string} username
 * @property {number} points
 */
