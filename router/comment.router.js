const express = require("express");
const authorizationMiddleware = require("../middleware/auth");
const {
  createComment,
  getAllComments,
  deleteComment,
  updateComment,
  //   getAllCommentsCount,
} = require("../controller/comment.controller");
const CommentRouter = express.Router();

// CommentRouter.get("/count", authorizationMiddleware, getAllCommentsCount);
CommentRouter.post("/create", createComment);
CommentRouter.get("/", getAllComments);
CommentRouter.delete("/:id", deleteComment);
CommentRouter.put("/:id", updateComment);

module.exports = CommentRouter;
