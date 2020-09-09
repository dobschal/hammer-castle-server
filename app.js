const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const db = require("./lib/database");
const cors = require("cors");
const hammerService = require("./service/hammerService");

// // // // // // // // // // // // // // // // // // // // // // // // //

if (process.env.ADMIN_PASSWORD === undefined) {
  throw new Error("Missing admin password");
}
if (process.env.SECRET === undefined) {
  throw new Error("Missing server secret!");
}

// // // // // // // // // // // // // // // // // // // // // // // // //

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "static")));

// // // // // // // // // // // // // // // // // // // // // // // // //

//  Load and instantiate controllers
const controllerDirPath = path.join(__dirname, "controller");
const fileExtension = ".js";
fs.readdir(controllerDirPath, function(err, files) {
  if (err) {
    return console.log("Unable to load controllers: ", err);
  }
  files.forEach(function(filename) {
    console.log("[app] Load controller: ", filename);
    app.use(
      `/${filename.replace(fileExtension, "").replace("index", "")}`,
      require(path.join(controllerDirPath, filename))
    );
  });

  //  Error handler
  app.use(function(err, req, res) {
    console.log("[app] Error response: ", err);
    res.status(err.status || 500).send({
      message: err.message || "An unhandled error occurred.",
      error: err
    });
  });
});

// // // // // // // // // // // // // // // // // // // // // // // // //

//   Run db migrations on startup
const dbMigrations = path.join(__dirname, "dbMigration");
fs.readdir(dbMigrations, function(err, files) {
  if (err) {
    return console.log("[app] Unable to load db migration scripts: ", err);
  }
  files.forEach(function(filename) {
    const result = db
      .prepare("SELECT * FROM migration WHERE name=?")
      .get(filename);
    if (result === undefined) {
      console.log("Run db mgiration: ", filename);
      require(path.join(dbMigrations, filename)).call(this, app);
      db.prepare("INSERT INTO migration (name) values (?);").run(filename);
    }
  });
});

// // // // // // // // // // // // // // // // // // // // // // // // //

//  Websocket
const http = require("http").createServer(app);
const { connections } = require("./service/websocket").init(http);
setInterval(() => {
  console.log("[app] Websocket connections: ", Object.keys(connections).length);
  Object.keys(connections).forEach(username => {
    connections[username].emit("HEARTBEAT", { yeah: "Yeah " + username + "!" });
  });
}, 3000);

// // // // // // // // // // // // // // // // // // // // // // // // //

http.listen(8082, () => {
  console.log("[app] Listening on *:" + 8082);
});

// // // // // // // // // // // // // // // // // // // // // // // // //

// Scheduler
setInterval(hammerService.makeHammers, 10000);
