/**
 * @type {object}
 * @property {function} validate
 * @property {object} error
 */
const tv4 = require("tv4");
const path = require("path");
const SchemaError = require("../error/SchemaError");
const schemasDirectory = path.join(__dirname, "../schema");
const schemaExtension = ".js";

function is(data, schema, schemaName) {
  data = replaceNullWithUndefined(data);
  if(typeof schema === "string") {
    schemaName = schema;
    schema = require(path.join(
        schemasDirectory,
        schemaName + schemaExtension
    ));
  }
  if (!tv4.validate(data, schema)) {
    let status = 500;
    if (
        String(schemaName)
            .toLowerCase()
            .includes("request")
    ) {
      status = 400;
    }
    const message = `Error occurred for '${schemaName}' with '${tv4.error.dataPath}': '${tv4.error.message}'`;
    console.warn(`[schema] ${message}`);
    throw new SchemaError(status, message);
  }
  return true;
}

function replaceNullWithUndefined(data) {
  if (data === null) {
    return undefined;
  } else if (Array.isArray(data)) {
    return data.map(replaceNullWithUndefined);
  } else if (typeof data === "object") {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key] === null) {
          delete data[key];
        } else if (typeof data[key] === "object") {
          data[key] = replaceNullWithUndefined(data[key]);
        } else if (Array.isArray(data[key])) {
          data[key] = data[key].map(replaceNullWithUndefined);
        }
      }
    }
  }
  return data;
}

module.exports = {is};
