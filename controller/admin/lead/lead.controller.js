const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ZodError } = require("zod");
const { leadValidationSchema } = require("../../../utils/validations");

const createLead = async (req, res) => {
  try {
    // Validate request body
    const validation = leadValidationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid data format",
        issues: validation.error.errors.map((err) => err.message),
      });
    }

    // Destructure validated data
    const validatedData = validation.data;

    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can create lead!" });
    }

    // Create a new lead
    const lead = await prisma.lead.create({
      data: {
        name: validatedData.name,
        position: validatedData.position,
        email: validatedData.email,
        website: validatedData.website,
        phone: validatedData.phone,
        leadValue: validatedData.leadValue,
        currencySymbol: validatedData.currencySymbol,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        zipCode: validatedData.zipCode,
        defaultLanguage: validatedData.defaultLanguage,
        company: validatedData.company,
        description: validatedData.description,
        tags: validatedData.tags,
        isPublic: validatedData.isPublic,
        adminId: req.userId,
      },
    });

    // Send success response
    // console.log(lead);
    return res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: error.errors.map((err) => err.message),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update lead API

const updateLead = async (req, res) => {
  try {
    // Validate request body
    const validation = leadValidationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid data format",
        issues: validation.error.errors.map((err) => err.message),
      });
    }

    // Destructure validated data
    const validatedData = validation.data;

    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can update lead!" });
    }

    // Check if the lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: req.params.id },
    });

    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found!" });
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        name: validatedData.name,
        position: validatedData.position,
        email: validatedData.email,
        website: validatedData.website,
        phone: validatedData.phone,
        leadValue: validatedData.leadValue, // Store as float array
        currencySymbol: validatedData.currencySymbol, // Store as string array
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        zipCode: validatedData.zipCode,
        defaultLanguage: validatedData.defaultLanguage, // Store as string array
        company: validatedData.company,
        description: validatedData.description,
        tags: validatedData.tags,
        isPublic: validatedData.isPublic,
      },
    });

    // Send success response
    return res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: error.errors.map((err) => err.message),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// get all leads API

const getAllLeads = async (req, res) => {
  try {
    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can view leads!" });
    }

    // Extract pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch total count of leads
    const totalLeads = await prisma.lead.count({
      where: { adminId: req.userId },
    });

    // Fetch paginated leads
    const leads = await prisma.lead.findMany({
      where: { adminId: req.userId },
      skip,
      take: limit,
      orderBy: { created_at: "desc" }, // Optional: sort by most recent
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalLeads / limit);

    // Respond with paginated leads and pagination info
    res.status(200).json({
      leads,
      pagination: {
        currentPage: page,
        totalPages,
        totalLeads,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
};
// delete lead API with ID

const deleteLead = async (req, res) => {
  try {
    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can delete leads!" });
    }

    // Check if the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found!" });
    }

    // Delete the lead
    const deletedLead = await prisma.lead.delete({
      where: { id: req.params.id },
    });

    res
      .status(200)
      .json({ message: "Lead deleted successfully", lead: deletedLead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
};

// get all leads count api

const getLeadsCount = async (req, res) => {
  try {
    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only admin can view leads count!" });
    }

    // Fetch the total count of leads
    const leadsCount = await prisma.lead.count();
    res
      .status(200)
      .json({ message: "Successfully fetched leads count", leadsCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch leads count" });
  }
};

// search lead API
const searchLeads = async (req, res) => {
  try {
    // Extract search query parameters
    const { name, email, phone } = req.query;

    // Check if admin exists and has the correct role
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can search leads!" });
    }

    // Build dynamic search filter
    const searchConditions = [];
    if (name)
      searchConditions.push({ name: { contains: name, mode: "insensitive" } });
    if (email)
      searchConditions.push({
        email: { contains: email, mode: "insensitive" },
      });
    if (phone)
      searchConditions.push({
        phone: { contains: phone, mode: "insensitive" },
      });

    // Fetch leads based on search query
    const leads = await prisma.lead.findMany({
      where: {
        adminId: req.userId,
        ...(searchConditions.length > 0 ? { OR: searchConditions } : {}), // Apply OR only if there are conditions
      },
    });
    if (leads.length > 0) {
      return res
        .status(200)
        .json({ message: "Successfully fetched leads", leads });
    } else {
      return res.status(404).json({ message: "Leads not found!" });
    }
    res.status(200).json({ leads });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to search leads",
      error: error.message,
    });
  }
};

module.exports = {
  createLead,
  updateLead,
  getAllLeads,
  deleteLead,
  getLeadsCount,
  searchLeads,
};
