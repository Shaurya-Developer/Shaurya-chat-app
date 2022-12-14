const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server); // socketio expects to be called by raw http server so we did little bit of refactoring

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

// let count = 0;

// server(emit) -> client(receive) -> countUpdated
// client(emit) -> server(receive) -> increment
io.on("connection", (socket) => {
  console.log("New web socket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room); // socket will join to specific room

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`)); // it emits msg to everyone in a specific room except the user who run this command

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    // socket.broadcast.emit("message", generateMessage("A new user has joined")); // it emits msg to everyone except the user who run this command
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message)); // io.to.emit sends msg to all in a specific room
    callback(); // we can give data which we want to give back to client
  }); // for giving acknowledgement back to client we pass one more arguent in callback function and call it at bottom of the page

  socket.on("sendLocation", (location, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(user.username, location)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(user.username, `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  }); // when user disconnect we use socket.on("disconnect")
  /*
  socket.emit("countUpdated", count); // we are sending an event from server and we'll recieve it on client, here whatever we are providing will be available to client on callback function
  socket.on("increment", () => {
    count++;
    //socket.emit("countUpdated", count); // it emits event to specific connection
    io.emit("countUpdated", count); // it emits event to every connection
  });
  */
}); // it takes 2 arguments 1- name of connection, 2- function (it takes an argument which have information regarding new connection), so connection is going to fire everytime socketio gets new connection

app.get("/", (req, res) => {
  res.send("index.html");
});

server.listen(3000, () => {
  console.log(`App running on port ${port}`);
});
