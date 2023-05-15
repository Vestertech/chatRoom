// Importing Required Modules
const express = require("express");
// const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Creating Express App and Server
const app = express();
const http = require("http").createServer(app);

// Setting Up Socket.IO
const io = require("socket.io")(http);

app.use(express.static("public"));

// Connecting to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

// dotenv.config({ path: './config.env' });

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, UseUnifiedTopology: true })
  .then(() => console.log("Mongodb connected successfully..."))
  .catch((err) => {
    console.log("err");
  });

  // Defining Mongoose Schema and Model
const MessageSchema = new mongoose.Schema({
  author: String,
  content: String,
  image: String,
});

const Message = mongoose.model("Message", MessageSchema);

// Setting Up Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Handling Socket.IO Events
io.on("connection", (socket) => {
  console.log("A new client is connected");

  // Receiving event from server side
  socket.on("username", (username) => {
    // Broadcast to all using io
    console.log("The logged in username is " + username);
    socket.username = username;
    io.emit("user joined", username);
  });

  // Returning previous messages.
  Message.find({})
    .then((messages) => {
      // Emit all messages to the new client
      socket.emit("load messages", messages);
    })
    .catch((err) => {
      console.error(err);
    });

  socket.on("chat message", (msg) => {
    const message = new Message({
      author: msg.author,
      content: msg.content,
      image: msg.image,
    });
    message
      .save()
      .then(() => {
        io.emit("chat message", msg);
      })
      .catch((err) => console.log(err));
  });

  socket.on("disconnect", () => {
    io.emit("user left", socket.username);
  });
});

// Starting the Server
const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log(` App is running on ${port}`);
});
