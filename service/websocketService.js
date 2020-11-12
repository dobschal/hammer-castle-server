const security = require("../lib/security");
const schema = require("../lib/schema");
const userService = require("./userService");
const db = require("../lib/database");
const event = require("../lib/event.js");

const websocket = {
  io: undefined,
  connections: {}
};

function broadcast(message, data) {
  Object.keys(websocket.connections).forEach(key => websocket.connections[key].emit(message, data));
}


function sendTo(username, event, data) {
  if (websocket.connections[username]) {
    websocket.connections[username].emit(event, data);
  }
}

/**
 * @param {string} username
 * @return {boolean}
 */
function isOnline(username) {
  return Boolean(websocket.connections[username]);
}

function init(http) {
  if (websocket.io) {
    return websocket;
  }

  //    Initialize socket.io and allow CORS
  websocket.io = require("socket.io")(http, {
    path: "/api/ws",
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
  websocket.io.use(function (socket, next) {
    if (!socket.handshake.query || !socket.handshake.query.token) {
      return next(new Error("Authentication error"));
    }
    try {
      const tokenBody = security.getValidTokenBody(
          socket.handshake.query.token,
          process.env.SECRET
      );
      schema.is(tokenBody, "UserTokenBody");
      const user = userService.getUserFromTokenBody(tokenBody);
      if (!user) throw new Error("User missing");
      socket.user = user;
      next();
    } catch (e) {
      next(e);
    }
  }).on("connection", socket => {
    if (!socket.user) return;
    console.log("[app] User connected: ", socket.user.username);
    db.prepare("UPDATE USER SET last_active_at=? WHERE username=?;").run(Date.now(), socket.user.username);
    websocket.connections[socket.user.username] = socket;
    event.emit(event.USER_CONNECTED, socket.user);
    socket.on("disconnect", () => {
      console.log("[app] User disconnected: ", socket.user.username);
      db.prepare("UPDATE USER SET last_active_at=? WHERE username=?;").run(Date.now(), socket.user.username);
      delete websocket.connections[socket.user.username];
    });
  });
  return websocket;
}

module.exports = {init, broadcast, sendTo, isOnline, ...websocket};
