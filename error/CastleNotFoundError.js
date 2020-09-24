function CastleNotFoundError(message) {
    this.status = 404;
    this.message = message;
}

CastleNotFoundError.prototype.toString = function () {
    return `CastleNotFoundError: ${this.status}. ${this.message}`;
};

module.exports = CastleNotFoundError;
