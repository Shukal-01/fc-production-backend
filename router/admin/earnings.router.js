const express = require('express');
const earningsController = express.Router();
const earningsDataController = require("../../controller/admin/salaryDetails.controller");

// earningsController.post('/', earningsDataController.EarningsData)
earningsController.get('/all-earnings', earningsDataController.getAllEarningsData)
earningsController.delete('/delete/:id', earningsDataController.deleteEarningsByID)
earningsController.post('/create', earningsDataController.createEarningHead)
earningsController.get('/:id', earningsDataController.getEarningsById)
earningsController.put('/update', earningsDataController.updateEarningHead)

module.exports = earningsController;