function SchemaError(status = 400, detail) {
  this.status = status;
  this.message =
    "Schema validation failed. Some variable has an unexpected value.";
  this.detail = detail;
}

SchemaError.prototype.toString = function () {
  return `SchemaError: ${this.status}. ${this.message}. ${this.detail}`;
};

module.exports = SchemaError;
