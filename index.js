import { config } from "dotenv";

import express from "express";
const app = express();
import cors from "cors";

import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

var corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.243.91:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(authRoutes);

import { createServer } from "http";
const server = createServer(app);

import socketio from "socket.io";
import mongoose from "mongoose";
const io = socketio(server);
const PORT = process.env.PORT || 5000;
import { addUser, removeUser, getUser } from "./helper.js";
import Room from "./models/Room.js";
import Message from "./models/Message.js";

config();
const mongoDB = process.env.MONGODB_URL;
mongoose
  .connect(mongoDB)
  .then(() => console.log("Connected"))
  .catch((error) => {
    console.log(error.message);
  });

app.get("/set-cookies", (req, res) => {
  res.cookie("Username", "Kiran");
  res.cookie("isAuthenticated", true, {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.send("Cookies Set successfully");
});

app.get("/get-cookies", (req, res) => {
  const cookies = req.cookies;
  res.json(cookies);
});

io.on("connection", (socket) => {
  console.log(socket.id);
  Room.find().then((result) => {
    socket.emit("output-rooms", result);
  });
  socket.on("create-room", (name) => {
    // console.log(`The name received is ${name}`);
    const room = new Room({ name });
    room.save().then((result) => {
      io.emit("room-created", result);
    });
  });
  socket.on("join", ({ name, room_id, user_id }) => {
    const { error, user } = addUser({
      socket_id: socket.id,
      name,
      room_id,
      user_id,
    });
    socket.join(room_id);
    if (error) {
      console.log("Join error", error);
    } else {
      console.log("Join user", user);
    }
  });

  socket.on("send-message", (message, room_id, callback) => {
    const user = getUser(socket.id);
    const msgToStore = {
      name: user.name,
      user_id: user.user_id,
      room_id,
      text: message,
    };
    console.log(msgToStore);
    const msg = new Message(msgToStore);
    msg.save().then((result) => {
      io.to(room_id).emit("message", result);
      callback();
    });
  });
  socket.on("get-messages-history", (room_id) => {
    Message.find({ room_id }).then((result) => {
      socket.emit("output-messages", result);
    });
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`listening on *: ${PORT}`);
});
