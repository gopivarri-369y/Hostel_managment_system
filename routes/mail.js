const express = require('express');
const nodemailer = require('nodemailer');
const config = require('../config');

const router = express.Router();

let transporter = null;
if (config.mail.user && config.mail.pass) {
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: { user: config.mail.user, pass: config.mail.pass },
  });
}

router.post('/send-email', (req, res, next) => {
  const { studentEmail, studentName, ownerEmail, ownerName } = req.body;
  if (!ownerEmail || !studentName) {
    return res.status(400).send('Missing owner email or student name');
  }

  if (!transporter) {
    console.warn('Email not configured (MAIL_USER/MAIL_PASS). Skipping send.');
    return res.send('Email not configured; message not sent.');
  }

  const mailOptions = {
    from: config.mail.user,
    to: ownerEmail,
    replyTo: studentEmail,
    subject: `Student Interest in Your Hostel: ${studentName}`,
    text: `Dear ${ownerName || 'Owner'},\n\nA student named ${studentName} is interested in your hostel.\n\nName: ${studentName}\nEmail: ${studentEmail}\nPlease reach out for further details.\n\nBest regards,\nHostel Management System`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent:', info.response);
    res.send('Email sent successfully');
  });
});

module.exports = router;
