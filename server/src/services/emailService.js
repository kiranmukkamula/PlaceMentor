const nodemailer = require('nodemailer');

// Mock setup for development, change to real SMTP in production
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'mock_user@ethereal.email',
      pass: 'mock_pass'
  }
});

const sendNextRoundEmail = async (students) => {
  for (const student of students) {
    try {
      await transporter.sendMail({
        from: '"PlaceMentor" <noreply@placementor.com>',
        to: student.email,
        subject: 'You have been selected for the Next Round!',
        text: `Dear ${student.name},\n\nCongratulations! You have cleared the current round and are moved to the next round of the interview process.\n\nBest of luck!`,
      });
      console.log(`Sent NEXT_ROUND email to ${student.email}`);
    } catch (err) {
      console.error(`Error sending email to ${student.email}`, err);
    }
  }
};

const sendFinalSelectionEmail = async (students) => {
  for (const student of students) {
    try {
      await transporter.sendMail({
        from: '"PlaceMentor" <noreply@placementor.com>',
        to: student.email,
        subject: 'Congratulations! You are Selected!',
        text: `Dear ${student.name},\n\nCongratulations! You have been finally selected for the position.\n\nThe company HR will reach out to you soon with further details.`,
      });
      console.log(`Sent FINAL_SELECTION email to ${student.email}`);
    } catch (err) {
      console.error(`Error sending email to ${student.email}`, err);
    }
  }
};

module.exports = {
  sendNextRoundEmail,
  sendFinalSelectionEmail
};
