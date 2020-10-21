const fs = require("fs");
const path = require("path");

const inputPath = "./schema/entity";
const outputPath = "./generated/jsDocsTypeDefs.js";

run();

function run() {
    console.log("[jsDocsGenerator] Go.");

    if (fs.existsSync(path.join(__dirname, outputPath))) {
        fs.unlinkSync(path.join(__dirname, outputPath));
    }

    const entitySchemas = path.join(__dirname, inputPath);
    const entitySchemaScripts = fs.readdirSync(entitySchemas);
    let jsDocTypeDefs = "";

    entitySchemaScripts.forEach(function (filename) {
        const schema = require(path.join(__dirname, inputPath, filename));
        const schemaName = filename.replace(".js", "");
        const typeDef = getJsDocTypeDefFromSwaggerSchema(schemaName, schema);
        if (jsDocTypeDefs.includes("@typedef " + schemaName + "Type")) {
            throw new Error("Typedef '" + schemaName + "' does already exist.");
        }
        jsDocTypeDefs += typeDef;
    });

    const result = fs.writeFileSync(path.join(__dirname, outputPath), jsDocTypeDefs);
    console.log("[jsDocsGenerator] Done.");
}

function getJsDocTypeDefFromSwaggerSchema(name, schema, typeDef, parent) {
    typeDef = typeDef || `/**
 * Auto generated type definition.
 * @typedef ${name}Type
`;
    switch (schema.type) {
        case "object":
            typeDef += ` * @type {object}
`;

            for (const key in schema.properties) {
                typeDef = getJsDocTypeDefFromSwaggerSchema(key, schema.properties[key], typeDef, schema);
            }
            break;
        case "array":
            throw new Error("Arrays are not supported yet...");
        default:
            name = parent && parent.required && parent.required.includes(name) ? `${name} - required` : `${name}`;
            typeDef += ` * @property {${schema.type}} ${name}
`;
            break;
    }
    return parent ? typeDef : `${typeDef} */
`;
}
