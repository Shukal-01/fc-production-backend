const { Router } = require("express");
const {
  createLead,
  getAllLeads,
  deleteLead,
  updateLead,
  getLeadsCount,
  searchLeads,
} = require("../../controller/admin/lead/lead.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");
const LeadRouter = Router();

LeadRouter.get("/search", authorizationMiddleware, searchLeads);
LeadRouter.get("/count", authorizationMiddleware, getLeadsCount);
LeadRouter.post("/create", authorizationMiddleware, createLead);
LeadRouter.get("/", authorizationMiddleware, getAllLeads);
LeadRouter.delete("/:id", authorizationMiddleware, deleteLead);
LeadRouter.put("/:id", authorizationMiddleware, updateLead);

module.exports = LeadRouter;
