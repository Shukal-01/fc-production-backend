const { config } = require("dotenv");
const nodemailer = require("nodemailer");

config();
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendProjectCreatedMail = async (email, projectName) => {
  // console.log(email);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "You have been added in new project",
    html: `<div><h2>You have been added in new project called ${projectName}</h2></div>`,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendProjectCreatedMail };
