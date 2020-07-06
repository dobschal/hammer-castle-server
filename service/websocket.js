const security = require("../lib/security");
const schema = require("../lib/schema");
const userService = require("../service/user");

let io;
const connections = {};

function init(http) {
  if (io) {
    return { io, connections };
  }

  //    Initialize socket.io and allow CORS
  io = require("socket.io")(http, {
    handlePreflightRequest: (req, res) => {
      const headers = {
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Origin": req.headers.origin, // or the specific origin you want to give access to,
        "Access-Control-Allow-Credentials": true
      };
      res.writeHead(200, headers);
      res.end();
    }
  });

  //   Apply token authentication
  io.use(function(socket, next) {
    if (!socket.handshake.query || !socket.handshake.query.token) {
      return next(new Error("Authentication error"));
    }
    try {
      const tokenBody = security.getValidTokenBody(
        socket.handshake.query.token,
        process.env.secret
      );
      schema.is(tokenBody, "UserTokenBody");
      const user = userService.getUserFromTokenBody(tokenBody);
      socket.user = user;
      next();
    } catch (e) {
      next(e);
    }
  }).on("connection", socket => {
    console.log("[app] User connected: ", socket.user.username);
    connections[socket.user.username] = socket;
    socket.on("disconnect", () => {
      console.log("[app] User disconnected: ", socket.user.username);
      delete connections[socket.user.username];
    });
  });
  return { io, connections };
}

module.exports = { init };
