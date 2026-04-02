const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sendMessage = async (req, res) => {
  const { content, roomId } = req.body;

  try {
    if (!content || !roomId) {
      return res
        .status(400)
        .json({ error: "Content and roomId are required." });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        users: { select: { id: true } },
      },
    });
    if (!room) {
      return res.status(404).json({ error: "Chat room not found." });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.userId,
        roomId,
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({ message: message, room: room, users: room.users });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" + error.message });
  }
};

module.exports = { sendMessage };
