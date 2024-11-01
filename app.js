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
  const onSocketJoin = async (username) => {
    socket.join(username);
    console.log(`${username} joined the room`);

    await Message.find({
      $or: [{ receiverUsername: username }, { senderUsername: username }],
    })
      .sort({ createdAt: 1 })
      .exec()
      .then((messages) => {
        socket.emit("loadOldMessages", messages);
      })
      .catch((err) => {
        console.error("Error retrieving messages: ", err);
      });
  };

  socket.on("joinRoom", async (username) => {
    await onSocketJoin(username);
  });

  socket.on(
    "sendMessage",
    async ({ senderUsername, receiverUsername, message }) => {
      const roomLength =
        io.sockets.adapter.rooms.get(senderUsername)?.size || 0;

      if (roomLength === 0) {
        await onSocketJoin(senderUsername);
      }

      if (roomLength !== 0) {
        const newMessage = new Message({
          senderUsername,
          receiverUsername,
          isRead: false,
          message,
        });

        newMessage
          .save()
          .then((storedMessage) => {
            io.to(senderUsername).emit("receiveMessage", {
              senderUsername: storedMessage.senderUsername,
              receiverUsername: storedMessage.receiverUsername,
              messageId: storedMessage._id.toString(),
              createdAt: storedMessage.createdAt.toUTCString(),
              message: storedMessage.message,
            });
            io.to(receiverUsername).emit("receiveMessage", {
              senderUsername: storedMessage.senderUsername,
              receiverUsername: storedMessage.receiverUsername,
              messageId: storedMessage._id.toString(),
              createdAt: storedMessage.createdAt.toUTCString(),
              message: storedMessage.message,
            });
          })
          .catch((err) => {
            console.error("Error saving message: ", err);
          });
      }
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`Disconnected: ${reason}`);
  });
});
