module.exports = function UnauthorisedError(message, status = 401) {
  this.status = status;
  this.message = message;
};
