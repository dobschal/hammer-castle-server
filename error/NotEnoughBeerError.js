function NotEnoughBeerError(message) {
    this.status = 409;
    this.message = message;
}

NotEnoughBeerError.prototype.toString = function () {
    return `NotEnoughBeerError: ${this.status}. ${this.message}`;
};

module.exports = NotEnoughBeerError;
