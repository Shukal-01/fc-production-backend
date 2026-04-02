const express = require("express");
// const { loginClientOrAdmin } = require("../controller/admin/client/detail.controller");
const authorizationMiddleware = require("../middleware/auth");
const { getUserById } = require("../controller/user.controller");
const { loginClientOrAdmin } = require("../controller/admin/staff/login.controller");
const userRouter = express.Router();

userRouter.post("/login", loginClientOrAdmin)
userRouter.get("/", authorizationMiddleware, getUserById);

module.exports = userRouter;
