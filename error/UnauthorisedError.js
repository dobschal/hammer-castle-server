function UnauthorisedError(message, status = 401) {
  this.status = status;
  this.message = message;
}

UnauthorisedError.prototype.toString = function () {
  return `UnauthorisedError: ${this.status}. ${this.message}`;
};

module.exports = UnauthorisedError;
