module.exports = {
  type: "object",
  required: ["username", "password"],
  properties: {
    username: {type: "string"},
    password: {type: "string"},
    color: {type: "string"}
  }
};
