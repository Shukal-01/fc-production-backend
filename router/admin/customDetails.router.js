const express = require('express');
const customDetailsRouter = express.Router();
const customDetailsController = require("../../controller/admin/staff/customDetails.controller");

customDetailsRouter.post('/', customDetailsController.customFieldDetails)
customDetailsRouter.get('/', customDetailsController.getAllCustomFields)
customDetailsRouter.get('/:id', customDetailsController.getCustomFieldById)
customDetailsRouter.delete('/:id', customDetailsController.deleteCustomFields)
customDetailsRouter.put('/:id', customDetailsController.updateCustomFields)

module.exports = customDetailsRouter;
