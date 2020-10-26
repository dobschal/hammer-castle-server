const security = require("../lib/security");
const UnauthorisedError = require("../error/UnauthorisedError");

function getTokenFromRequest(req) {
  for (const key in req.headers) {
    if (
      req.headers.hasOwnProperty(key) &&
      key.toLowerCase() === "authorization"
    ) {
      return req.headers[key].replace("Bearer ", "");
    }
  }
}

function getTokenBody(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new UnauthorisedError("Missing auth token.");
  }
  return security.getValidTokenBody(token, process.env.SECRET);
}

module.exports = { getTokenFromRequest, getTokenBody };
