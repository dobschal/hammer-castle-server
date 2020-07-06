const crypto = require("crypto");
const Base64 = require("js-base64").Base64;
const UnauthorisedError = require("../error/UnauthorisedError");

function encrypt(plainText, salt) {
  return crypto
    .createHash("sha256")
    .update(plainText + salt)
    .digest("hex");
}

function signedUserToken(tokenBody, secret) {
  const tokenBodyAsString = JSON.stringify(tokenBody);
  return `${Base64.encode(tokenBodyAsString)}.${Base64.encode(
    encrypt(tokenBodyAsString, secret)
  )}`;
}

function getValidTokenBody(signedUserToken, secret) {
  if (!signedUserToken || !signedUserToken.includes(".")) {
    throw new UnauthorisedError("Token has wrong format.");
  }
  let [body, signature] = signedUserToken.split(".");
  body = Base64.decode(body);
  signature = Base64.decode(signature);
  if (encrypt(body, secret) !== signature) {
    throw new UnauthorisedError("Token is not valid.");
  }
  body = JSON.parse(body);
  if (body.expires < Date.now()) {
    throw new UnauthorisedError("Token is expired.");
  }
  return body;
}

module.exports = { encrypt, signedUserToken, getValidTokenBody };
