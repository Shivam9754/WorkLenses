
const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, code) => {
  // DEV MODE: If no SMTP credentials are provided, simply log the code.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('\n================ WORKLENS SECURITY ================');
    console.log(`[DEV MODE] Email Destination: ${email}`);
    console.log(`[DEV MODE] Verification Code: ${code}`);
    console.log('===================================================\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"WorkLens Security" <no-reply@worklens.ai>',
      to: email,
      subject: 'WorkLens Verification Code',
      text: `Your secure verification code is: ${code}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #000; color: #fff;">
          <h1 style="color: #84cc16;">WorkLens.</h1>
          <p>Your secure verification code is:</p>
          <div style="background: #111; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border: 1px solid #333; display: inline-block;">
            ${code}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Do not share this code.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Code sent to ${email}`);
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
  }
};

module.exports = { sendVerificationEmail };
