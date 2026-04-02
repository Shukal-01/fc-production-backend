const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      include: {
        adminDetails: true,
        clientDetails: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = { getUserById };
