const { PrismaClient } = require("@prisma/client");
const {
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
} = require("../../../utils/validations");
const { z } = require("zod");
const prisma = new PrismaClient();

const getAllLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: { staff: true, leavePolicy: true },
    });
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve leave requests" });
  }
};

const getLeaveRequestsByStaffId = async (req, res) => {
  const { id } = req.params;
  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { staffId: id },
      include: { staff: true, leavePolicy: true },
    });

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve leave requests" });
  }
};

const createLeaveRequest = async (req, res) => {
  const staffId = req.params.id;
  try {
    const validation = createLeaveRequestSchema.safeParse({
      ...req.body,
      staffId,
    });
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }
    const { leaveTypeId, request_date, start_date, end_date, status } = validation.data;

    const newLeaveRequest = await prisma.leaveRequest.create({
      data: {
        staffId,
        leaveTypeId,
        request_date,
        start_date,
        end_date,
        status,
      },
    });

    res.status(201).json(newLeaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // console.log(error);
    res.status(500).json({ error: "Unable to create leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  const { id } = req.params;
  try {

    const validation = updateLeaveRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }

    const { status } = validation.data;

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status, ...req.body },
    });

    res.json(updatedLeaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Unable to update leave request" });
  }
};

const deleteLeaveRequest = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.leaveRequest.delete({ where: { id } });
    res.json({ message: "Leave request deleted" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete leave request" });
  }
};

module.exports = {
  getAllLeaveRequests,
  getLeaveRequestsByStaffId,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
};
