const express = require("express");
const loginController = require("../../controller/admin/staff/login.controller");
const loginRouter = express.Router();

loginRouter.post("/", loginController.matchStaffLoginOTP);

module.exports = loginRouter;
