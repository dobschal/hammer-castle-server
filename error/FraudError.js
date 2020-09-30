function FraudError(message) {
    this.status = 400;
    this.message = message;
}

FraudError.prototype.toString = function () {
    return `FraudError: ${this.status}. ${this.message}`;
};

module.exports = FraudError;
