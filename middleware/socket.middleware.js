// socketMiddleware.js
const { io } = require("../index.js"); // Import `io` from your `index.js`

const socketMiddleware = {
    sendNotification: (eventName, data, room = null) => {
        if (room) {
            io.to(room).emit(eventName, data); // Send notification to a specific room
        } else {
            io.emit(eventName, data); // Send notification to all connected users
        }
    },
};

module.exports = socketMiddleware;