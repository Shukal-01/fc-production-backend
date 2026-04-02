const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { clientSchema, idSchema } = require("../../../utils/validations.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const searchClientByCompanyOrVatNumber = async (req, res) => {
  const { company, vat_number, page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic `where` conditions

    // Fetch paginated data
    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        clientDetails: {
          company: {
            contains: company?.trim() || "",
            mode: "insensitive",
          },
          vat_number: {
            contains: vat_number?.trim() || "",
            mode: "insensitive",
          },
        },
      },
      include: {
        clientDetails: true,
      },
      skip,
      take: limitNum,
    });

    // Count total matching records
    const totalClients = clients.length;

    // Return paginated response
    return res.status(200).json({
      data: clients,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalClients / limitNum),
        totalRecords: totalClients,
      },
    });
  } catch (error) {
    console.error("Failed Searching client:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed Searching client!",
      error: error.message,
    });
  }
};

const createClient = async (req, res) => {
  const validation = clientSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validation.error.issues[0].message,
    });
  }
  const admin = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  if (!admin) {
    return res.status(400).json({
      message: "Admin not found!",
    });
  }
  if (admin.role !== "ADMIN") {
    return res.status(400).json({ message: "Only admin can create client!" });
  }
  const {
    company,
    vat_number,
    phone,
    website,
    groups,
    currency,
    default_language,
    address,
    country,
    state,
    city,
    zip_code,
    status,
  } = validation.data;
  try {
    const isClientExists = await prisma.user.findFirst({
      where: { email: req.body.email },
    });
    // console.log(isClientExists);
    if (isClientExists) {
      return res.status(400).json({
        status: false,
        message: "Client with this email already exists",
      });
    }
    // Check for existing VAT number
    const isVatExists = await prisma.clientDetails.findFirst({
      where: { vat_number },
    });

    if (isVatExists) {
      return res.status(400).json({
        status: false,
        message: "Client with this VAT number already exists",
      });
    }
    const newClient = await prisma.user.create({
      data: {
        email: req.body.email,
        role: "CLIENT",
        is_verified: false,
        mobile: phone,
        name: req.body.name,
        password: req.body.password
          ? await bcrypt.hash(req.body.password, 10)
          : "",
        adminId: req.userId,
      },
    });
    const clientDetails = await prisma.clientDetails.create({
      data: {
        company,
        vat_number,
        website,
        groups,
        currency,
        default_language,
        address,
        country,
        state,
        city,
        zip_code,
        status,
        userId: newClient.id,
      },
    });

    res.status(201).json(clientDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create client " + error.message,
    });
  }
};

const fetchAllClients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const skip = (pageNum - 1) * limitNum;
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res.status(400).json({ message: "Only admin can get clients!" });
    }

    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        adminId: req.userId,
      },
      include: {
        clientDetails: true,
        // Lead: true,
      },
      skip,
      take: limitNum,
    });

    const totalClients = await prisma.user.count({
      where: {
        role: "CLIENT",
        adminId: req.userId,
      },
    });

    return res.status(200).json({
      data: clients,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalClients / limitNum),
        totalRecords: totalClients,
      },
    });
  } catch (error) {
    console.error("Failed fetching all clients:", error);
    return res.status(500).json({
      status: false,
      message: "Failed fetching all clients: " + error.message,
    });
  }
};

// fetch all count all clients
const fetchAllClientsCount = async (req, res) => {
  try {
    // Validate the presence of `userId` in the request
    if (!req.userId) {
      return res.status(400).json({
        message: "Invalid request: Admin ID is missing.",
      });
    }

    // console.log("Request Body:", req.body); // Debugging info

    // Fetch the count of clients associated with the admin
    const totalClients = await prisma.user.count({
      where: {
        role: "CLIENT",
        adminId: req.userId,
      },
    });

    // console.log("Total Clients:", totalClients); // Debugging info

    return res.status(200).json({
      message: "Successfully fetched client count",
      count: totalClients,
    });
  } catch (error) {
    console.error("Error fetching client count:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching client count. Please try again later.",
      error: error.message, // Optional: Include error message
    });
  }
};

const updateSpecificClient = async (req, res) => {
  const { id } = req.params;
  const {
    company,
    vat_number,
    website,
    groups,
    currency,
    default_language,
    address,
    country,
    state,
    city,
    zip_code,
    status,
  } = req.body;

  try {
    // Check if the clientDetails with the provided id exists
    const client = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!client) {
      return res.json({
        status: false,
        message: "Client not found.",
      });
    }

    const updatedClient = await prisma.user.update({
      where: { id: id },
      data: {
        email: req.body.email,
        name: req.body.name,
        mobile: req.body.phone,
      },
    });

    const updatedClientDetails = await prisma.clientDetails.update({
      where: { userId: id },
      data: {
        company,
        vat_number,
        website,
        groups,
        currency,
        default_language,
        address,
        country,
        state,
        city,
        zip_code,
        status,
      },
    });

    // Proceed with the update if the client exists
    // const updatedClient = await prisma.user.update({
    //   where: { id: parseInt(id) },
    //   data: {
    //     company,
    //     vat_number,
    //     website,
    //     groups,
    //     currency,
    //     default_language,
    //     address,
    //     country,
    //     state,
    //     city,
    //     zip_code,
    //     status,
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         email: true,
    //         is_verified: true,
    //       },
    //     },
    //   },
    // });

    return res.status(200).json({
      status: true,
      data: updatedClient,
      message: "Client updated successfully",
    });
  } catch (error) {
    console.error("Failed updating client:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed updating the client: " + error.message,
    });
  }
};

const changeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await prisma.clientDetails.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      status: true,
      message: "Client status updated successfully",
    });
  } catch (error) {
    console.error("Failed updating client status:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed the client status" + error.message,
    });
  }
};

const deleteSpecificClient = async (req, res) => {
  const { id } = req.params;
  if (id === "bulk") {
    return deleteBulkClient(req, res);
  } else {
    try {
      const validateId = idSchema.safeParse(id);
      if (!validateId.success) {
        return res.status(400).json({
          message: "Invalid id provided",
        });
      }

      const client = await prisma.user.findUnique({
        where: { id },
      });

      if (!client) {
        return res.status(404).json({
          message: "Client not found",
        });
      }

      await prisma.user.delete({ where: { id } });

      return res.status(200).json({
        status: true,
        message: `Client with id ${id} and associated user deleted successfully`,
      });
    } catch (error) {
      console.error("Failed deleting client:", error.message);
      return res.status(500).json({
        message: "Failed while deleting the client" + error.message,
      });
    }
  }
};

const deleteBulkClient = async (req, res) => {
  const ids = req.body; // expecting an array of client UUIDs

  try {
    // Validate the array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Invalid Id provided",
      });
    }

    // Validate each ID individually using idSchema
    for (const id of ids) {
      const validateId = idSchema.safeParse(id);
      if (!validateId.success) {
        return res.status(400).json({
          message: `Invalid ID provided: ${id}`,
        });
      }
    }

    // Retrieve clients to get associated userIds
    const clients = await prisma.clientDetails.findMany({
      where: { userId: { in: ids } },
      select: { id: true, userId: true },
    });

    if (clients.length === 0) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Extract client and user IDs for deletion
    const clientIds = clients.map((client) => client.id);
    const userIds = clients.map((client) => client.userId);

    // Delete clients and associated users in bulk
    await prisma.clientDetails.deleteMany({
      where: { id: { in: clientIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    return res.status(200).json({
      success: true,
      message: "Clients and associated users deleted successfully",
    });
  } catch (error) {
    console.error("Failed deleting clients:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed while deleting the clients: " + error.message,
    });
  }
};

const fetchClientInfoSpecificID = async (req, res) => {
  const { id } = req.params;

  try {
    const validateId = idSchema.safeParse(id);
    if (!validateId.success) {
      return res.status(400).json({
        message: "Invalid id provided",
      });
    }

    const client = await prisma.clientDetails.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            is_verified: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.status(200).json({
      data: client,
      message: `Client details for id ${id} fetched successfully`,
    });
  } catch (error) {
    console.error("Failed fetching client :", error.message);
    return res.status(500).json({
      message: "Failed while fetching the client details" + error.message,
    });
  }
};

const loginClient = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: "Email and password are required",
    });
  }

  prisma.user
    .findUnique({
      where: { email, role: "CLIENT" },
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: "Client not found",
        });
      }
      const isPasswordMatch = bcrypt.compareSync(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          message: "Invalid password" + error.message,
        });
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      return res.status(200).json({
        message: "Login successful",
        token,
      });
    })
    .catch((error) => {
      console.error("Error during login:", error.message);
      return res.status(500).json({
        message: "Error during login",
      });
    });
};

const getClientProjects = async (req, res) => {
  const client = await prisma.user.findUnique({
    where: { id: req.userId },
  });
  // console.log(client, "client");

  const projects = await prisma.project.findMany({
    where: { customerId: client.clientDetails },
    include: {
      TaskDetail: true,
      customerDetails: {
        include: {
          user: true,
        },
      },
      staffId: true,
    },
  });
  return res
    .status(200)
    .json({ message: "Projects fetched successfully", data: projects });
};

const searchClientByName = async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;

  if (!name) {
    return res.status(400).json({
      status: false,
      message: "Name query parameter is required.",
    });
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  if (!admin) {
    return res.status(400).json({
      message: "Admin not found!",
    });
  }
  if (admin.role !== "ADMIN") {
    return res.status(400).json({ message: "Only admin can create client!" });
  }

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const clients = await prisma.user.findMany({
      where: {
        adminId: req.userId,
        role: "CLIENT",
        name: {
          contains: name.trim(),
          mode: "insensitive",
        },
      },
      include: {
        clientDetails: true,
      },
      skip,
      take: limitNum,
    });
    const totalClients = await prisma.user.count({
      where: {
        adminId: req.userId,
        role: "CLIENT",
        name: {
          contains: name.trim(),
          mode: "insensitive",
        },
      },
    });

    console.log(clients, "clients");

    return res.status(200).json({
      data: clients,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalClients / limitNum),
        totalRecords: totalClients,
      },
    });
  } catch (error) {
    console.error("Error searching for client:", error);

    return res.status(500).json({
      status: false,
      message: "An error occurred while searching for clients.",
      error: error.message,
    });
  }
};

const clientDeleteInBulk = async (req, res) => {
  const clientIDs = req.body.ids; // Expecting an array of client IDs from the frontend
  try {
    // Perform bulk delete operation
    const deletedClients = await prisma.user.deleteMany({
      where: {
        id: { in: clientIDs }, // Deletes clients where IDs match any in the provided array
      },
    });

    // Check if any clients were deleted
    if (deletedClients.count === 0) {
      return res.status(404).json({ message: "No clients found to delete!" });
    }

    // Return success response
    return res.status(200).json({
      message: "Clients deleted successfully!",
      deletedCount: deletedClients.count,
    });
  } catch (error) {
    // Handle errors
    return res
      .status(500)
      .json({ message: "Failed to delete clients: " + error.message });
  }
};

module.exports = {
  clientDeleteInBulk,
  createClient,
  fetchAllClients,
  updateSpecificClient,
  deleteSpecificClient,
  fetchClientInfoSpecificID,
  changeStatus,
  loginClient,
  searchClientByCompanyOrVatNumber,
  getClientProjects,
  searchClientByName,
  deleteBulkClient,
  fetchAllClientsCount,
};
