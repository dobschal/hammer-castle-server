const tv4 = require("tv4");
const path = require("path");
const SchemaError = require("../error/SchemaError");
const schemasDirectory = path.join(__dirname, "../schema");
const schemaExtension = ".js";

function is(data, schemaName) {
  const schema = require(path.join(
    schemasDirectory,
    schemaName + schemaExtension
  ));
  if (!tv4.validate(data, schema, true, true)) {
    let status = 500;
    if (
      String(schemaName)
        .toLowerCase()
        .includes("request")
    ) {
      status = 400;
    }
    throw new SchemaError(status, tv4.error);
  }
  return true;
}

module.exports = { is };
