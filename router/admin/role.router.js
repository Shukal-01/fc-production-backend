const {
  addRole,
  deleteRole,
  fetchRole,
  fetchRoleWithId,   // Added this line
  updateRole,
  searchRoleByName,
  deleteRoleInBulk,
} = require("../../controller/admin/role.controller.js");
const authorizationMiddleware = require("../../middleware/auth");

const { Router } = require("express");

const roleRouter = Router();

// Create a new Role
roleRouter.post("/", authorizationMiddleware, addRole);

// search role by name 
roleRouter.get('/search', authorizationMiddleware, searchRoleByName)

// Get all Roles
roleRouter.get("/", authorizationMiddleware, fetchRole);

//Delete Role in bulk
roleRouter.delete("/bulk", authorizationMiddleware, deleteRoleInBulk);

// Update a Role
roleRouter.put("/:id", authorizationMiddleware, updateRole);

// Fetch a Role with role ID
roleRouter.get("/:id", authorizationMiddleware, fetchRoleWithId);

// Delete a Role
roleRouter.delete("/:id", authorizationMiddleware, deleteRole);

module.exports = roleRouter;

