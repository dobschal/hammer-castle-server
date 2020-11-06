function UserNotFoundError(message) {
    this.status = 404;
    this.message = message;
}

UserNotFoundError.prototype.toString = function () {
    return `UserNotFoundError: ${this.status}. ${this.message}`;
};

module.exports = UserNotFoundError;
