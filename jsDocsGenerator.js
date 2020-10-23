const fs = require("fs");
const path = require("path");

const inputPaths = ["./schema", "./schema/entity", "./schema/request", "./schema/dto"];
const outputPath = "./generated/jsDocsTypeDefs.js";

run();

function run() {
    console.log("[jsDocsGenerator] Go.");

    if (fs.existsSync(path.join(__dirname, outputPath))) {
        fs.unlinkSync(path.join(__dirname, outputPath));
    }

    let jsDocTypeDefs = "";

    inputPaths.forEach(inputPath => {
        const entitySchemas = path.join(__dirname, inputPath);
        const entitySchemaScripts = fs.readdirSync(entitySchemas);
        entitySchemaScripts.forEach(function (filename) {
            const pathToFile = path.join(__dirname, inputPath, filename);
            if (fs.statSync(pathToFile).isDirectory()) return;
            const schema = require(pathToFile);
            const schemaName = filename.replace(".js", "");
            const typeDef = getJsDocTypeDefFromSwaggerSchema(getTypeName(schemaName, inputPath), schema);
            if (jsDocTypeDefs.includes("@typedef " + getTypeName(schemaName, inputPath))) {
                throw new Error("Typedef '" + schemaName + "' does already exist.");
            }
            jsDocTypeDefs += typeDef;
        });
    });

    const result = fs.writeFileSync(path.join(__dirname, outputPath), jsDocTypeDefs);
    console.log("[jsDocsGenerator] Done.");
}

/**
 * @param {string} schemaName
 * @param {string} inputPath
 * @return {string}
 */
function getTypeName(schemaName, inputPath) {
    const temp = inputPath.replace("schema", "").split("/");
    return camelize(schemaName) + camelize(temp[temp.length - 1]);
}

/**
 * @param {string} string
 * @return {string}
 */
function camelize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getJsDocTypeDefFromSwaggerSchema(name, schema, typeDef, parent) {
    typeDef = typeDef || `/**
 * @typedef ${name}
`;
    schema.name = name;
    switch (schema.type) {
        case "object":
            if (!parent) {
                typeDef += ` * @type {object}
`;

                for (const key in schema.properties) {
                    typeDef = getJsDocTypeDefFromSwaggerSchema(key, schema.properties[key], typeDef, schema);
                }
            } else {
                const childTypeName = camelize(parent.name) + camelize(name);
                typeDef += ` * @property {${childTypeName}} ${name}
`;
                typeDef = getJsDocTypeDefFromSwaggerSchema(childTypeName, schema) + typeDef;
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
