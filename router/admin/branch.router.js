const { Router } = require("express");
const {
  createBranch,
  getAllBranch,
  deleteBranch,
  updateBranch,
  searchBranch,
  branchCount,
} = require("../../controller/admin/branch.controller");
const authorizationMiddleware = require("../../middleware/auth");

const branchRouter = Router();

branchRouter.get("/search", authorizationMiddleware, searchBranch);
branchRouter.get("/count", authorizationMiddleware, branchCount);
branchRouter.get("/", authorizationMiddleware, getAllBranch);
branchRouter.post("/", authorizationMiddleware, createBranch);
branchRouter.delete("/:id", authorizationMiddleware, deleteBranch);
branchRouter.put("/:id", authorizationMiddleware, updateBranch);

module.exports = branchRouter;
