require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
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

// login controller => client or admin can login => if user is not verified => send otp and return that user is not verified if verified => send token
const loginClientOrAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // If user role is "CLIENT", handle client-specific login
    // if (user.role === "CLIENT") {
    //   const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    //   return res.status(200).json({
    //     message: "Client login successful",
    //     token,
    //     user: { id: user.id, email: user.email, role: user.role },
    //   });
    // }

    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const otpExpiresAt = new Date(
      new Date(indiaTime).getTime() + 5 * 60 * 1000
    );

    // console.log("OTP Expires At:", otpExpiresAt);
    if (!user.is_verified && user.role === "ADMIN") {
      const otp = generateOTP();
      await sendOtp(email, otp);
      await prisma.user.update({
        where: { email },
        data: { otp: parseInt(otp), otpExpiresAt: otpExpiresAt },
      });
      return res
        .status(403)
        .json({ message: "User is not verified. Otp sent on given mail." });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    return res
      .status(200)
      .json({ message: "Login successful", token: token, user: user });
  } catch (error) {
    // console.log(error, error.message);
    res.json(500).json({
      message: "Failed to login for both admin and client",
      error: error,
    });
  }
};

// function to match staff MPin
const matchStaffLoginOTP = async (req, res) => {
  const { email, login_otp } = req.body;
  try {
    const staff = await prisma.user.findFirst({
      where: { email: email, role: "STAFF" },
    });
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (staff.otp === login_otp) {
      const token = jwt.sign({ userId: staff.id }, process.env.JWT_SECRET);
      return res.status(200).json({ message: "OTP matched", token: token });
    } else {
      return res
        .status(400)
        .json({ message: "OTP not matched" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to login and match OTP", error: error });
  }
};

// signup with google
// Initialize Google OAuth2 Client

module.exports = { matchStaffLoginOTP, loginClientOrAdmin };
