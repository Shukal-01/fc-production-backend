require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const rootRouter = require("./router/routes");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const _dirname = path.dirname("");
const buildpath = path.join(_dirname, "../frontend-flowchanger.ai/build");
app.use(express.static(buildpath));

// const sendNotificationMiddleware = require("./middleware/notification.middleware.js");
const notificationEmitter = require("./middleware/notification.middleware.js");

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api/", rootRouter);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Attach notification middleware with `io`
// const sendNotification = sendNotificationMiddleware(io);

// Updated notification logic for socket events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("setup", ({ token }) => {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const id = decodedToken.userId;
      console.log("User ID:", id);
      socket.join(id); // Join the user's ID as a room
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  });

  socket.on("join_room", (roomId) => {
    console.log("User joined room:", roomId);
    socket.join(roomId); // Join specific room
  });

  notificationEmitter.on("newProjectNotification", ({ event, data, recipients }) => {
    // console.log(`Emitting event: ${event} with data:`, data);
    // console.log("Sending notification to users: ", recipients);

    recipients.forEach((recipientId) => {
      // console.log(`Emitting to user: ${recipientId}`);
      io.to(recipientId).emit(event, data);
    });
  });

  socket.on("send_notification", ({ event, data, recipients }) => {
    if (recipients && recipients.length > 0) {
      recipients.forEach((recipientId) => {
        // console.log(`Sending notification to recipient: ${recipientId}`);
        io.to(recipientId).emit(event, data);
      });
    } else {
      console.warn("No recipients provided for notification.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export `sendNotification` for use in other parts of the application
module.exports = { app, io };
