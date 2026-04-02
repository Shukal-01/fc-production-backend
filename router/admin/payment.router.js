const express = require("express");
const paymentRouter = express.Router();
const paymentController = require("../../controller/admin/payment.controller");

paymentRouter.post("/", paymentController.addPaymentHistory);
paymentRouter.get('/history/:year/:month', paymentController.getPaymentHistoryByDate);
// history/2024/12?page=2&limit=5
paymentRouter.get("/", paymentController.getAllPaymentHistory);
paymentRouter.get("/:id", paymentController.getPaymentHistoryById);
paymentRouter.put("/:id", paymentController.updatePaymentHistory);
paymentRouter.delete("/:id", paymentController.deletePaymentHistory);

module.exports = paymentRouter;
