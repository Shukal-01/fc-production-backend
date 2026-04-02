//notification.middleware.js
const EventEmitter = require('events');

// Create an instance of EventEmitter
class NotificationEmitter extends EventEmitter { }

const notificationEmitter = new NotificationEmitter();

// Export the emitter for use in other parts of the application
module.exports = notificationEmitter;
