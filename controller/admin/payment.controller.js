const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const prisma = new PrismaClient();

// Zod schemas for validation
const paymentHistorySchema = z.object({
  staffId: z.string().nonempty({ message: "Staff ID is required." }),
  date: z.coerce.date({
    errorMap: () => ({ message: "Invalid date format." }),
  }),
  amount: z.number().positive({ message: "Amount must be a positive number." }),
  type: z
    .enum(["ADVANCE", "SALARY"], { message: "Invalid payment type." })
    .default("SALARY"),
  status: z
    .enum(["PROCESSING", "SUCCESS", "FAILED", "SAVED"], {
      message: "Invalid payment status.",
    })
    .default("PROCESSING"),
  salaryDetailsId: z.string().optional(),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
});

const addPaymentHistory = async (req, res) => {
  try {
    const { userId: adminId } = req;
    const { data } = req.body;
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });
    for (let d of data) {
      const parsedData = paymentHistorySchema.parse(d);
      // console.log(parsedData)
      await prisma.paymentHistory.create({
        data: { ...d, adminId },
      });
    }
    res.status(201).json({ message: "Payment history added successfully." });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      // console.log(error.errors);
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

const getAllPaymentHistory = async (req, res) => {
  try {
    const { userId: adminId } = req;
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    const paymentHistories = await prisma.paymentHistory.findMany({
      where: { adminId },
      include: {
        staff: {
          include: {
            User: true,
          },
        },
      },
    });

    res.status(200).json(paymentHistories);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // console.log(error.errors);
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

//get payment history by dynamic month and year
const getPaymentHistoryByDate = async (req, res) => {
  try {
    const { userId: adminId } = req;
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    const { month, year } = req.params;
    const { page = "1", limit = "10" } = req.query;

    // Convert pagination parameters to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Calculate first and last day of the month in IST
    const firstDay = new Date(`${year}-${month}-01T00:00:00Z`);
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

    // Convert to Indian timezone using toLocaleString
    const firstDayIST = new Date(firstDay.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const lastDayIST = new Date(
      new Date(firstDayIST.getFullYear(), firstDayIST.getMonth() + 1, 0).toISOString()
    );

    // Fetch payment histories with pagination
    const paymentHistories = await prisma.paymentHistory.findMany({
      where: {
        adminId,
        date: {
          gte: firstDayIST,
          lte: lastDayIST,
        },
      },
      include: {
        staff: {
          include: {
            User: true,
          },
        },
      },
      skip,
      take: limitNumber,
    });

    // Fetch the total count for pagination meta info
    const totalRecords = await prisma.paymentHistory.count({
      where: {
        adminId,
        date: {
          gte: firstDayIST,
          lte: lastDayIST,
        },
      },
    });

    res.status(200).json({
      data: paymentHistories,
      meta: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getPaymentHistoryById = async (req, res) => {
  try {
    const { userId: adminId } = req;
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    const idSchema = z
      .string()
      .nonempty({ message: "Payment history ID is required." });
    const id = idSchema.parse(req.params.id);

    const paymentHistory = await prisma.paymentHistory.findFirst({
      where: { id, adminId },
      include: {
        staff: {
          include: {
            User: true,
          },
        },
      },
    });

    if (!paymentHistory) {
      return res.status(404).json({ message: "Payment history not found." });
    }

    res.status(200).json(paymentHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // console.log(error.errors);
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentHistory = async (req, res) => {
  try {
    const { userId: adminId } = req;
    // console.log(req.body);
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    const idSchema = z
      .string()
      .nonempty({ message: "Payment history ID is required." });
    const id = idSchema.parse(req.params.id);

    const data = paymentHistorySchema.partial().parse(req.body);

    const paymentHistory = await prisma.paymentHistory.update({
      where: { id, adminId },
      data,
    });

    res.status(200).json(paymentHistory);
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      // console.log(error.errors);
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

const deletePaymentHistory = async (req, res) => {
  try {
    const { userId: adminId } = req;
    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    const idSchema = z
      .string()
      .nonempty({ message: "Payment history ID is required." });
    const id = idSchema.parse(req.params.id);

    await prisma.paymentHistory.delete({
      where: { id, adminId },
    });

    res.status(200).json({ message: "Payment history deleted successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // console.log(error.errors);
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPaymentHistory,
  getAllPaymentHistory,
  getPaymentHistoryById,
  updatePaymentHistory,
  deletePaymentHistory,
  getPaymentHistoryByDate,
};
