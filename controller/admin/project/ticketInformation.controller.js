// const express = require('express');
// const { PrismaClient } = require('@prisma/client');
// const upload = require('../../../middleware/upload');
// const nodemailer = require('nodemailer');
// const { ticketInformationSchema } = require("../../../utils/validations");
// const path = require('path');
// const app = express();
// const prisma = new PrismaClient();

// // Add Ticket Information Query............................

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'sandeepkumar941732@gmail.com',
//         pass: 'rclc jgri fenf rhlj'
//     }
// });

// const addTicketInformation = async (req, res) => {
//     const validation = ticketInformationSchema.safeParse(req.body);

//   if (!validation.success) {
//     return res.status(400).json({
//       error: "Invalid data format",
//       issues: validation.error.format(),
//     });
//   }
//     const {
//         subject,
//         contact,
//         name,
//         email,
//         department,
//         cc,
//         tags,
//         asign_ticket,
//         priority,
//         service,
//         project,
//         ticket_body,
//         insert_link,
//         personal_notes,
//         projectId,
//         staffIdd
//     } = req.body;

//     const insert_files = req.file ? req.file.originalname : null;

//     try {
//         const ticketData = await prisma.ticketInformation.create({
//             data: {
//                 subject,
//                 contact,
//                 name,
//                 email,
//                 department,
//                 cc,
//                 tags,
//                 asign_ticket,
//                 priority,
//                 service,
//                 project,
//                 ticket_body,
//                 insert_link,
//                 personal_notes,
//                 insert_files,
//                 projectId,
//                 staffIdd
//             },
//         });

//         // Get Ticket number
//         const ticketNumber = `TICKET-${ticketData.id}`;
//         const mailOptions = {
//             from: 'sandeepkumar941732@gmail.com',
//             to: email,
//             subject: `Your Ticket #${ticketNumber} has been created`,
//             // text: `Thank you for submitting your ticket. Below are your ticket details.`,
//             html: `<p>Thank you for submitting your ticket. Below are your ticket details:</p>
//                 <ul>
//                     <li><strong>Ticket Number:</strong> ${ticketNumber}</li>
//                     <li><strong>Name:</strong> ${name}</li>
//                     <li><strong>Contact:</strong> ${contact}</li>
//                     <li><strong>Email:</strong> ${email}</li>
//                     <li><strong>Department:</strong> ${department}</li>
//                     <li><strong>Priority:</strong> ${priority}</li>
//                     <li><strong>Service:</strong> ${service}</li>
//                     <li><strong>Subject:</strong> ${subject}</li>
//                 </ul>
//                 <p>We will get back to you shortly.</p>`
//         };
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error('Error sending email:', error);
//                 return res.status(500).json({ status: 500, message: 'Error sending email', error: error.message });
//             } else {
//                 console.log('Email sent: ' + info.response);
//             }
//         });
//         return res.status(200).json({ status: 200, data: ticketData, message: `Ticket Created Successfully. Ticket number ${ticketNumber} has been sent to ${email}` });
//     } catch (error) {
//         console.error('Error creating ticket:', error);
//         return res.status(500).json({ status: 500, msg: 'Error creating ticket', error: error.message });
//     }
// };

// // Get ticket information
// const getTicketInformation = async(req,res)=> {
//     try{
//         const getData = await prisma.ticketInformation.findMany();
//         return res.status(200).json({status:200,message:"All Ticket Data : ",data:getData});
//     }catch(error){
//         return res.status(500).json({status:500,message:"failed to get ticket information!"});
//     }
// }

// const updateTicketInformation = async (req, res) => {
//     const { id } = req.params;
//     const {
//         subject,
//         contact,
//         name,
//         email,
//         department,
//         cc,
//         tags,
//         asign_ticket,
//         priority,
//         service,
//         project,
//         ticket_body,
//         insert_link,
//         personal_notes,
//         projectId,
//         staffIdd,
//     } = req.body;

//     const insert_files = req.file ? req.file.originalname : null; // Get uploaded file's name if it exists

//     try {
//         // Update ticket information
//         const updateTicketInfo = await prisma.ticketInformation.update({
//             where: { id: id },
//             data: {
//                 subject,
//                 contact,
//                 name,
//                 email,
//                 department,
//                 cc,
//                 tags,
//                 asign_ticket,
//                 priority,
//                 service,
//                 project,
//                 ticket_body,
//                 insert_link,
//                 personal_notes,
//                 insert_files,
//                 projectId,
//                 staffIdd,
//             },
//         });

//         // Prepare to send email with updated information
//         const ticketNumber = `TICKET-${updateTicketInfo.id}`; // Assuming ticket number is based on the ID
//         const mailOptions = {
//             from: 'sandeepkumar941732@gmail.com',
//             to: email,
//             subject: `Your Ticket #${ticketNumber} has been updated`,
//             // text: `Your ticket has been updated. Here are the new details:\n\n` +
//             //       `Subject: ${subject}\n` +
//             //       `Contact: ${contact}\n` +
//             //       `Name: ${name}\n` +
//             //       `Department: ${department}\n` +
//             //       `Priority: ${priority}\n` +
//             //       `Service: ${service}\n` +
//             //       `Thank you for your attention!`
//                   html: `<p>Your ticket has been updated. Here are the new details:</p>
//                   <ul>
//                       <li><strong>Ticket Number:</strong> ${ticketNumber}</li>
//                       <li><strong>Subject:</strong> ${subject}</li>
//                       <li><strong>Name:</strong> ${name}</li>
//                       <li><strong>Contact:</strong> ${contact}</li>
//                       <li><strong>Email:</strong> ${email}</li>
//                       <li><strong>Department:</strong> ${department}</li>
//                       <li><strong>Priority:</strong> ${priority}</li>
//                       <li><strong>Service:</strong> ${service}</li>
//                   </ul>
//                   <p>Thank you for your attention!</p>`
//         };

//         // Send the email
//         await transporter.sendMail(mailOptions);
//         console.log('Email sent successfully.');

//         return res.status(200).json({ status: 200, message: "Ticket updated successfully and email sent!", data: updateTicketInfo });
//     } catch (error) {
//         console.error("Error updating ticket information:", error);
//         return res.status(500).json({ status: 500, message: "Failed to update ticket information!", error: error.message });
//     }
// };

// // Delete Ticket Information
// const deleteTicketInformation = async(req,res) => {
//     const {id} = req.params;
//     try{
//         const deleteTicket = await prisma.ticketInformation.delete({
//             where:{
//                 id:id,
//             }
//         });
//         return res.status(200).json({status:200,message:"Ticket Inormation Delete Successfully! (" +id+ ")"});
//     }catch(error){
//         return res.status(500).json({status:500,message:"failed to delete the ticket information!"});
//     }
// }

// // Ticket Information Show by Id
// const showByIdTicketInfo = async(req,res) => {
//     const {id} = req.params;
//     try{
//         const getByIdTicket = await prisma.ticketInformation.findMany({
//             where:{
//                 id:id,
//             },
//         });
//         return res.json({status:200,message:"show the ticket information by id (" +id+ ")", getByIdTicket});
//     }catch(error)
//     {
//         return res.json({status:500,message:"failed to get the ticket information!"});
//     }
// }

// module.exports = { addTicketInformation, getTicketInformation, updateTicketInformation, deleteTicketInformation, showByIdTicketInfo };
