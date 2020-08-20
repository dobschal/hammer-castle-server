function CastleInsideBlockAreaError(message) {
    this.status = 409;
    this.message = message;
}

CastleInsideBlockAreaError.prototype.toString = function () {
    return `CastleInsideBlockAreaError: ${this.status}. ${this.message}`;
};

module.exports = CastleInsideBlockAreaError;
