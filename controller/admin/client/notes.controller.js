const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { clientNotesSchema } = require("../../../utils/validations");

const getAllNotes = async (req, res) => {
    try {
        const notes = await prisma.clientNotes.findMany();
        res.status(200).json(notes);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
const addNote = async (req, res) => {
    try {
        const validation = clientNotesSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid data format",
                issues: validation.error.issues[0].message
            });
        }
        const { title, description, color } = validation.data;
        const clientId = await prisma.user.findFirst({
            where: {
                id: req.userId,
                role: "CLIENT"
            },
            include: {
                clientDetails: true
            }
        })
        const newNote = await prisma.clientNotes.create({
            data: {
                title,
                description,
                color,
                clientId: clientId?.clientDetails?.id
            },
        });
        res.status(201).json(newNote);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getNotesById = async (req, res) => {
    try {
        const { id } = req.params;
        const notes = await prisma.clientNotes.findUnique({
            where: {
                id: id,
            },
        });
        res.status(200).json(notes);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
const getNotesByClientId = async (req, res) => {
    try {
        const { clientId } = req.params;
        const notes = await prisma.clientNotes.findMany({
            where: {
                clientId: clientId,
            },
        });
        res.status(200).json(notes);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// json 

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = req.body;
        const updatedNote = await prisma.clientNotes.update({
            where: {
                id: id,
            },
            data: note,
        });
        res.status(200).json(updatedNote);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.params;
    if (id === "bulk-delete") {
        return deleteMultipleNote(req, res);
    }
    try {
        await prisma.clientNotes.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json(
            {
                data: [],
                message: "Note deleted successfully"
            });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
const deleteMultipleNote = async (req, res) => {
    try {
        const { ids } = req.body;
        await prisma.clientNotes.deleteMany({
            where: {
                id: {
                    in: ids, // Match records with IDs in the provided array
                },
            },
        });
        res.status(200).json(
            {
                data: [],
                message: "Multiple Notes deleted successfully"
            });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    addNote,
    getAllNotes,
    getNotesById,
    updateNote,
    deleteNote,
    getNotesByClientId,
    deleteMultipleNote
};
