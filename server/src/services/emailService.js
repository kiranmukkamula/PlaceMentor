const nodemailer = require('nodemailer');

// Configure SMTP transport dynamically based on environment variables
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log(`[EmailService] Initializing real SMTP transport via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('[EmailService] SMTP credentials not set in .env. Using mock fallback transport.');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mock_user@ethereal.email',
        pass: 'mock_pass'
      }
    });
  }
};

const transporter = createTransporter();
const FROM_EMAIL = process.env.SMTP_FROM || '"PlaceMentor" <noreply@placementor.com>';

const sendNextRoundEmail = async (students) => {
  for (const student of students) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 10px;">
          <h2 style="color: #4f46e5;">Congratulations, ${student.name}!</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            We are pleased to inform you that you have cleared the current interview round for <strong>${student.company_name || 'the company'}</strong>!
          </p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <p style="margin: 0; color: #1e293b; font-weight: bold;">Status: Advanced to Next Round</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Please log in to your student portal to check round schedules and preparation guidelines. Best of luck!
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">PlaceMentor Campus Placement System</p>
        </div>
      `;

      await transporter.sendMail({
        from: FROM_EMAIL,
        to: student.email,
        subject: `🎉 Selected for Next Round - ${student.company_name || 'PlaceMentor'}`,
        text: `Dear ${student.name},\n\nCongratulations! You have cleared the current round for ${student.company_name || 'the company'} and have advanced to the next round of the interview process.\n\nBest of luck!\n- PlaceMentor Team`,
        html: htmlContent
      });
      console.log(`[EmailService] Sent NEXT_ROUND email to ${student.email}`);
    } catch (err) {
      console.error(`[EmailService] Error sending email to ${student.email}:`, err.message);
    }
  }
};

const sendFinalSelectionEmail = async (students) => {
  for (const student of students) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 10px;">
          <h2 style="color: #16a34a;">Congratulations, ${student.name}! 🚀</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            We are thrilled to inform you that you have been <strong>finally selected</strong> for the position at <strong>${student.company_name || 'the company'}</strong>!
          </p>
          <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <p style="margin: 0; color: #15803d; font-weight: bold;">Status: Final Selection Confirmed</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            The company HR and campus placement team will reach out to you shortly with formal offer details and next steps.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">PlaceMentor Campus Placement System</p>
        </div>
      `;

      await transporter.sendMail({
        from: FROM_EMAIL,
        to: student.email,
        subject: `🌟 Final Offer Selection - ${student.company_name || 'PlaceMentor'}`,
        text: `Dear ${student.name},\n\nCongratulations! You have been finally selected for the position at ${student.company_name || 'the company'}.\n\nThe company HR will reach out to you soon with formal offer details.\n\nBest wishes,\n- PlaceMentor Team`,
        html: htmlContent
      });
      console.log(`[EmailService] Sent FINAL_SELECTION email to ${student.email}`);
    } catch (err) {
      console.error(`[EmailService] Error sending email to ${student.email}:`, err.message);
    }
  }
};

module.exports = {
  sendNextRoundEmail,
  sendFinalSelectionEmail
};
