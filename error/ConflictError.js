function ConflictError(message) {
  this.status = 409;
  this.message = message;
}

ConflictError.prototype.toString = function () {
  return `ConflictError: ${this.status}. ${this.message}`;
};

module.exports = ConflictError;
