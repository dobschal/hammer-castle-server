const UnauthorisedError = require("../error/UnauthorisedError");
const schema = require("../lib/schema");
const securityService = require("../service/securityService");

module.exports = function hasUserRole(allowedRoles = []) {
  return function(req, res, next) {
    if (allowedRoles.length === 0) {
      return next();
    }
    const tokenBody = securityService.getTokenBody(req);
    schema.is(tokenBody, "UserTokenBody");
    if (allowedRoles.some(role => tokenBody.userRoles.includes(role))) {
      return next();
    }
    throw new UnauthorisedError("Permission denied.", 403);
  };
};
