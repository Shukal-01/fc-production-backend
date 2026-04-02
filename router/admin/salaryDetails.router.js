const express = require('express');
const salaryController = express.Router();
const salaryDetailsController = require("../../controller/admin/salaryDetails.controller");
const authorizationMiddleware = require('../../middleware/auth');

// salary
salaryController.get("/single/:staffId/date=:month/:year", salaryDetailsController.getSelectedMonthSalary);
salaryController.post('/', salaryDetailsController.addOrUpdateSalaryDetails)
salaryController.get('/', salaryDetailsController.getAllSalaryData)
salaryController.put('/:id', salaryDetailsController.updateSalaryData)
salaryController.delete('/:id', salaryDetailsController.deleteSalaryRecord)
salaryController.get('/:staffId', salaryDetailsController.getSalaryDetailsById)
salaryController.get("/month/:staffId", salaryDetailsController.getCurrentMonthSalary)


module.exports = salaryController;