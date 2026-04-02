const { Router } = require("express");
const {
  addNewClient,
  fetchAllClients,
  updateSpecificClient,
  fetchClientInfoSpecificID,
  deleteSpecificClient,
  changeStatus,
  createClient,
  searchClientByCompanyOrVatNumber,
  loginClient,
  getClientProjects,
  searchClientByName,
  clientDeleteInBulk,
  fetchAllClientsCount,
} = require("../../controller/admin/client/detail.controller");
const authorizationMiddleware = require("../../middleware/auth");

const clientRouter = Router();

// count client api
clientRouter.get("/count", authorizationMiddleware, fetchAllClientsCount);

clientRouter.delete("/bulk-delete", clientDeleteInBulk);

clientRouter.get(
  "/client-projects",
  authorizationMiddleware,
  getClientProjects
);

clientRouter.get("/search-by-name", authorizationMiddleware, searchClientByName);
// search for a specific client By Name
clientRouter.get("/search", searchClientByCompanyOrVatNumber);
// create a new client
clientRouter.post("/", authorizationMiddleware, createClient);

// Get all Roles
clientRouter.get("/", authorizationMiddleware, fetchAllClients);

// upate a client with specific id
clientRouter.put("/:id", updateSpecificClient);

clientRouter.patch("/:id", changeStatus);

// Fetch a client with specific id
clientRouter.get("/:id", fetchClientInfoSpecificID);

// delete a client with specific id
clientRouter.delete("/:id", deleteSpecificClient);

clientRouter.post("/login", loginClient);

module.exports = clientRouter;
