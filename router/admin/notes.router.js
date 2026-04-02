const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notesRouter = express.Router();
const notesController = require("../../controller/admin/client/notes.controller.js");
const authorizationMiddleware = require('../../middleware/auth.js');

notesRouter.post('/', authorizationMiddleware, notesController.addNote);
notesRouter.get('/', notesController.getAllNotes);
notesRouter.get('/:id', notesController.getNotesById);
notesRouter.get('/client/:clientId', notesController.getNotesByClientId);
notesRouter.put('/:id', notesController.updateNote);
notesRouter.delete('/:id', notesController.deleteNote);
notesRouter.delete('/bulk-delete', notesController.deleteMultipleNote);

module.exports = notesRouter;
