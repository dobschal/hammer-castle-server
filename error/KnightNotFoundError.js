function KnightNotFoundError(message) {
    this.status = 404;
    this.message = message;
}

KnightNotFoundError.prototype.toString = function () {
    return `KnightNotFoundError: ${this.status}. ${this.message}`;
};

module.exports = KnightNotFoundError;
