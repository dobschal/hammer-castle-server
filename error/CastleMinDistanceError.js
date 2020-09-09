function CastleMinDistanceError(message) {
    this.status = 409;
    this.message = message;
}

CastleMinDistanceError.prototype.toString = function () {
    return `CastleMinDistanceError: ${this.status}. ${this.message}`;
};

module.exports = CastleMinDistanceError;
