const { PrismaClient } = require("@prisma/client");
const {
  staffBackgroundVerificationSchema,
} = require("../../../utils/validations");
const prisma = new PrismaClient();

const getNewFields = (verificationType, data, verificationFile) => {
  let newFields = {};
  switch (verificationType) {
    case "aadhaar":
      newFields = {
        aadhaar_verification_status: "VERIFIED",
        aadhaar_number: data.aadhaar_number,
        aadhaar_file: verificationFile,
      };
      break;

    case "pan":
      newFields = {
        pan_verification_status: "VERIFIED",
        pan_number: data.pan_number,
        pan_file: verificationFile,
      };
      break;
    case "voter_id":
      newFields = {
        voter_id_verification_status: "VERIFIED",
        voter_id_number: data.voter_id_number,
        voter_id_file: verificationFile,
      };
      break;

    case "uan":
      newFields = {
        uan_verification_status: "VERIFIED",
        uan_number: data.uan_number,
        uan_file: verificationFile,
      };
      break;

    case "driving_license":
      newFields = {
        driving_license_status: "VERIFIED",
        driving_license_number: data.driving_license_number,
        driving_license_file: verificationFile,
      };
      break;

    case "address":
      newFields = {
        address_status: "VERIFIED",
        current_address: data.current_address,
        permanent_address: data.permanent_address,
        address_file: verificationFile,
      };
      break;

    case "face":
      newFields = {
        face_verification_status: "VERIFIED",
        face_file: verificationFile,
      };
      break;

    default:
      throw new Error("Invalid verification type");
  }
  return newFields;
};

// Function to handle the fetch all staff background verification
const fetchAllStaffBgVerification = async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure that the staff_id is an integer
    const staffBgVerifyData =
      await prisma.staffBackgroundVerification.findFirst({
        where: {
          staffId: id,
        },
      });
    // If no data found, return 404 response
    if (!staffBgVerifyData) {
      return res.status(404).json({
        status: false,
        message: `No verification data found for staff with id ${id}`,
      });
    }

    // Return the verification data
    return res.status(200).json({
      status: true,
      message: `fetch verification data for staffId=${id}`,
      data: staffBgVerifyData,
    });
  } catch (error) {
    // Send appropriate error response
    return res.status(500).json({
      status: false,
      message: `Error fetching verification data : ${error.message}`,
    });
  }
};

// Function to handle update  staff background verification
const updateStaffBgVerifcation = async (req, res) => {
  try {
    const { id, verificationType } = req.params;
    const verificationData = req.body;

    const verificationFile = req.imageUrl || null;

    // Collect the new fields based on verification type
    let staffVerificationFields = getNewFields(
      verificationType,
      verificationData,
      verificationFile
    );

    const validateStaffVerificationFields =
      staffBackgroundVerificationSchema.safeParse(staffVerificationFields);
    if (!validateStaffVerificationFields.success) {
      return res.status(400).json({
        success: false,
        message: validateStaffVerificationFields.error.issues[0].message,
      });
    }

    for (const key in staffVerificationFields) {
      if (
        staffVerificationFields[key] === null ||
        staffVerificationFields[key] === undefined
      ) {
        delete staffVerificationFields[key];
      }
    }

    // console.log(staffVerificationFields);
    // // Create a new verification record in the database
    const newStaffVerification =
      await prisma.staffBackgroundVerification.upsert({
        where: {
          staffId: id,
        },
        update: {
          ...staffVerificationFields, // Update with the new fields if the record already exists
        },
        create: {
          ...staffVerificationFields, // Create a new record if it doesn't exist
          staffId: id,
        },
      });

    // Return success response
    res.status(201).json({
      status: true,
      message: `update and create verification staff verification data for staffId=${id}`,
      data: newStaffVerification,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `error in create and update staff verification data : ${error.message}`,
    });
  }
};

// Export the functions staff background verification controller
module.exports = { fetchAllStaffBgVerification, updateStaffBgVerifcation };
