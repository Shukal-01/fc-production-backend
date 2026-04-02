const express = require("express");
const authorizationMiddleware = require("../middleware/auth");
const {
  getOneOnOneChat,
  createGroupChat,
} = require("../controller/chat.controller");
const ChatRouter = express.Router();

ChatRouter.get("/:id", authorizationMiddleware, getOneOnOneChat);
ChatRouter.post("/group", createGroupChat);

module.exports = ChatRouter;
