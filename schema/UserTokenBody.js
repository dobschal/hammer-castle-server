module.exports = {
  type: "object",
  required: ["expires", "username", "userRoles", "id"],
  properties: {
    expires: "number",
    username: "string",
    userRoles: "string", // comma separated!
    id: "number" // user id
  }
};
