module.exports = function ConflictError(message) {
  this.status = 409;
  this.message = message;
};
