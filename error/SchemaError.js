module.exports = function SchemaError(status = 400, detail) {
  this.status = status;
  this.message =
    "Schema validation failed. Some variable has an unexpected value.";
  this.detail = detail;
};
