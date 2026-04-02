const express = require('express');
const deductionsRouter = express.Router();
const deductionsController = require("../../controller/admin/salaryDetails.controller");



// deduction
deductionsRouter.get('/all', deductionsController.getAllDeductions)
deductionsRouter.get('/:id', deductionsController.getDeductionById)
deductionsRouter.post('/create', deductionsController.deductions)
deductionsRouter.put('/update', deductionsController.updateDeductions)
deductionsRouter.delete('/delete/:id', deductionsController.deleteDeductionsByID)


module.exports = deductionsRouter;