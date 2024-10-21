const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const socketIo = require("socket.io");

const adminRoutes = require("./routes/admin");
const tutorRoutes = require("./routes/tutor");
const studentRoutes = require("./routes/student");

const Message = require("./models/message");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_SERVER,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_SERVER);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/api/admin", adminRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/student", studentRoutes);

app.use((error, req, res) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data || [];
  res.status(status).json({ message: message, errors: data });
});

mongoose
  .connect(process.env.MONGO_DB_CONNECTION_STRING)
  .then(() => {
    server.listen(process.env.PORT || 8081);
  })
  .catch((err) => console.log(err));

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ studentUsername, tutorUsername }) => {
    const roomId = `${studentUsername}_${tutorUsername}`;
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    try {
      const messages = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .exec();
      socket.emit("loadOldMessages", messages);
    } catch {
      console.error("Error retrieving messages: ", err);
    }
  });

  socket.on("sendMessage", async ({ roomId, message, senderUsername }) => {
    const newMessage = new Message({
      roomId,
      message,
      senderUsername,
    });

    try {
      await newMessage.save();
      io.to(roomId).emit("receiveMessage", { roomId, senderUsername, message });
      console.log(
        `Message sent to room ${roomId}: ${senderUsername}, message: ${message}`
      );
    } catch (err) {
      console.error("Error saving message: ", err);
    }

    console.log(
      `Message sent to room ${roomId}: ${senderUsername}, message:${message}`
    );
  });

  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});
