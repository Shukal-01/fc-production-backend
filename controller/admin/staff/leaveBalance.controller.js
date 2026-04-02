const { PrismaClient } = require("@prisma/client");
const {
  createLeaveBalanceSchema,
  updateLeaveBalanceSchema,
} = require("../../../utils/validations");
const { z } = require("zod");
const prisma = new PrismaClient();

const getAllLeaveBalances = async (req, res) => {
  try {
    const leaveBalances = await prisma.leaveBalance.findMany({
      include: { staff: true, leavePolicy: true },
    });
    res.json(leaveBalances);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve leave balances" });
  }
};

const getLeaveBalanceById = async (req, res) => {
  const { id } = req.params;
  try {
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: { id },
      include: { staff: true, leavePolicy: true },
    });
    if (!leaveBalance)
      return res.status(404).json({ error: "Leave balance not found" });
    res.json(leaveBalance);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve leave balance" });
  }
};

const createLeaveBalance = async (req, res) => {
  try {
    const leaveTypeId = req.params.id;

    const validation = createLeaveBalanceSchema.safeParse({
      ...req.body,
      leaveTypeId,
    });
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }
    const { staffId, balance, used } = validation.data;

    const newLeaveBalance = await prisma.leaveBalance.create({
      data: {
        staffId,
        leavePolicyId: leaveTypeId,
        balance,
        used,
      },
    });

    res.status(201).json(newLeaveBalance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // console.log(error);
    res.status(500).json({ error: "Unable to create leave balance" });
  }
};

const updateLeaveBalance = async (req, res) => {
  const { id } = req.params;
  try {
    const validation = updateLeaveBalanceSchema.safeParse({
      ...req.body,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }

    const { balance, used } = validation.data;

    const updatedLeaveBalance = await prisma.leaveBalance.update({
      where: { id },
      data: { balance, used },
    });

    res.json(updatedLeaveBalance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Unable to update leave balance" });
  }
};

const updateLeaveBalanceForMultipleStaff = async (req, res) => {
  try {
    const { staffId, leaveTypeId, balance, used } = req.body;

    // Validate the incoming data
    const validation = z.object({
      staffId: z.array(z.string().uuid("Invalid Staff ID")),
      leaveTypeId: z.string().uuid("Invalid Leave Type ID"),
      balance: z.number().min(0).default(0),
      used: z.number().min(0).default(0),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { staffId: staffIds, leaveTypeId: leavePolicyId, balance: newBalance, used: newUsed } = validation.data;

    // Chunk staffIds to process in batches
    const chunkArray = (array, size) =>
      array.reduce((acc, _, i) => (i % size === 0 ? acc.concat([array.slice(i, i + size)]) : acc), []);

    const chunks = chunkArray(staffIds, 10); // Process 10 staff IDs at a time
    const updatedLeaveBalances = [];

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (id) => {
          const existingRecord = await prisma.leaveBalance.findFirst({
            where: {
              staffId: id,
              leavePolicyId,
            },
          });

          if (existingRecord) {
            // Update existing leave balance
            return prisma.leaveBalance.update({
              where: { id: existingRecord.id },
              data: { balance: newBalance, used: newUsed },
            });
          } else {
            // If no existing record, throw an error
            throw new Error(`Leave balance not found for staffId: ${id} and leavePolicyId: ${leavePolicyId}`);
          }
        })
      );

      updatedLeaveBalances.push(...results);
    }

    res.status(200).json({
      message: "Leave balances updated successfully",
      data: updatedLeaveBalances,
    });
  } catch (error) {
    console.error("Error updating leave balances:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    res.status(500).json({
      error: "Unable to update leave balances",
      details: error.message,
    });
  }
};

const deleteLeaveBalance = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.leaveBalance.delete({ where: { id } });
    res.json({ message: "Leave balance deleted" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete leave balance" });
  }
};

module.exports = {
  getAllLeaveBalances,
  getLeaveBalanceById,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  updateLeaveBalanceForMultipleStaff,
};
