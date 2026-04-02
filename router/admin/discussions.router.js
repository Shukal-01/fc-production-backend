const express = require('express');
const discussionRouter = express.Router();
const discussionController = require("../../controller/admin/project/discussions.controller");

discussionRouter.post('/', discussionController.addDiscussionDetails);
discussionRouter.get('/:id?', discussionController.getDiscussions)
discussionRouter.put('/:id', discussionController.updateDiscussions)
discussionRouter.delete('/:id', discussionController.deleteDiscussions)

module.exports = discussionRouter;
