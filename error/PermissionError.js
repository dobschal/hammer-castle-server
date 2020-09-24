function PermissionError(message) {
    this.status = 401;
    this.message = message;
}

PermissionError.prototype.toString = function () {
    return `PermissionError: ${this.status}. ${this.message}`;
};

module.exports = PermissionError;
