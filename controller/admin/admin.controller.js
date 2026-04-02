require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const prisma = new PrismaClient();
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type."));
  },
}).fields([
  { name: "profile_image", maxCount: 1 },
  { name: "company_logo", maxCount: 1 },
]);

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOtp = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `<div><h2>Your OTP Code</h2><p>Code: <strong>${otp}</strong></p></div>`,
  };
  await transporter.sendMail(mailOptions);
};

const adminSignup = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      mobile,
      company_name,
      company_logo,
    } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const otpExpiresAt = new Date(
      new Date(indiaTime).getTime() + 5 * 60 * 1000
    );

    // console.log("OTP Expires At:", otpExpiresAt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: first_name + " " + last_name,
        mobile,
        role: "ADMIN",
        otp: parseInt(otp),
        otpExpiresAt,
        // adminDetails: {
        //   company_name,
        //   company_logo,
        // },
      },
    });
    // console.log(admin);
    await sendOtp(email, otp);
    res
      .status(201)
      .json({ message: "OTP sent to your email for verification." });
  } catch (error) {
    console.error("Error in adminSignup:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const googleSignup = async (req, res) => {
  try {
    const { email, name, mobile } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email and password required." });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists." });

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        mobile,
        role: "ADMIN",
        is_verified: true,
      },
    });

    res
      .status(201)
      .json({ message: "OTP sent to your email for verification." });
  } catch (error) {
    console.error("Error in adminSignup:", error);
    res.status(500).json({ message: "Failed to create user." + error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found." });

    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    if (user.otp === parseInt(otp) && user.otpExpiresAt > new Date(indiaTime)) {
      await prisma.user.update({
        where: { email },
        data: { is_verified: true },
      });
      return res.status(200).json({ message: "OTP verified successfully." });
    } else {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateAdmin = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      const {
        email,
        mobile,
        company_name,
        package_id,
        time_format,
        time_zone,
        date_format,
        week_format,
      } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) return res.status(404).json({ message: "Admin not found." });

      const profileImage = req.files?.profile_image
        ? req.files.profile_image[0].filename
        : null;
      const companyLogo = req.files?.company_logo
        ? req.files.company_logo[0].filename
        : null;

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          mobile: mobile || user.mobile,
          adminDetails: {
            upsert: {
              create: {
                company_name: company_name,
                package_id: package_id,
                profile_image: profileImage,
                company_logo: companyLogo,
                time_format: time_format,
                time_zone: time_zone,
                date_format: date_format,
                week_format: week_format,
              },
              update: {
                company_name: company_name,
                package_id: package_id,
                profile_image: profileImage,
                company_logo: companyLogo,
                time_format: time_format,
                time_zone: time_zone,
                date_format: date_format,
                week_format: week_format,
              },
            },
          },
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

      res.status(200).json({ message: "Admin updated successfully.", token });
    });
  } catch (error) {
    console.error("Error in updateAdmin:", error);
    res.status(500).json({ message: "Failed to update admin details." });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      include: { adminDetails: true },
    });
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error getAllAdmins:", error);
    res.status(500).json({ message: "Failed to get admins." });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email." });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      return res.status(401).json({ message: "Invalid password." });

    if (!user && !isPasswordMatch)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login." + error.message });
  }
};

// Sign Up With Google

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signupWithGoogle = async (req, res) => {
  const { credential, access_token } = req.body;

  if (!credential && !access_token) {
    return res
      .status(400)
      .json({ message: "Google credential or access token is required." });
  }

  try {
    let payload;

    // Verify Google ID Token if provided
    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (access_token) {
      // Validate access token by fetching user info
      const userInfoResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      payload = userInfoResponse.data;
    }

    // Ensure payload is valid
    if (!payload || !payload.email || !payload.name) {
      return res
        .status(400)
        .json({ message: "Google account data incomplete." });
    }

    const { email, name } = payload;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    // console.log(existingUser);
    if (existingUser) {
      const token = jwt.sign(
        { userId: existingUser.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.status(200).json({
        message: "User already exists. Logged in successfully.",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          token,
        },
      });
    }
    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: "ADMIN",
        is_verified: true,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Google sign-up successful.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: "ADMIN",
        token,
      },
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid Google credential or token verification failed.",
      error: error.message,
    });
  }
};

// send reset password email
const requestPasswordReset = async (req, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email, role: "ADMIN" },
    });

    if (!user) {
      return res.status(404).json({ message: "Admin not found!" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const resetLink = `${process.env.FRONTEND_URL}`;
    // Send Email
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      status: false,
      message: "Failed to send mail for reset request password!.",
    });
  }
};

// Update password API with patch method
const updateAdminPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find Admin User by Email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        role: "ADMIN",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in updateAdminPassword:", error);
    res.status(500).json({ message: "Failed to update password." });
  }
};

module.exports = {
  adminSignup,
  verifyOTP,
  adminLogin,
  updateAdmin,
  getAllAdmins,
  signupWithGoogle,
  requestPasswordReset,
  updateAdminPassword,
};
