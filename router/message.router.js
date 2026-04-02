const { Router } = require("express");

const messageController = require("../controller/message.controller");
const authorizationMiddleware = require("../middleware/auth");

const MessageRouter = Router();

MessageRouter.post(
  "/send",
  authorizationMiddleware,
  messageController.sendMessage
);

module.exports = MessageRouter;
