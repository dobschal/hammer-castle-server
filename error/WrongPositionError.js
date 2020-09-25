function WrongPositionError(message) {
    this.status = 409;
    this.message = message;
}

WrongPositionError.prototype.toString = function () {
    return `WrongPositionError: ${this.status}. ${this.message}`;
};

module.exports = WrongPositionError;
