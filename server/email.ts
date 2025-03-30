import nodemailer from 'nodemailer';

// Email configuration
let transporter: nodemailer.Transporter;

/**
 * Initialize the email transporter with the given credentials
 */
export function initEmailService() {
  // For Gmail, you'll need to:
  // 1. Enable 2FA on your Google account
  // 2. Generate an App Password (Google Account -> Security -> App Passwords)
  // 3. Use that App Password here instead of your regular password
  
  // Check for required environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPass) {
    console.warn("Email credentials not set. Email sending will be disabled.");
    return false;
  }
  
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    
    console.log("Email service initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize email service:", error);
    return false;
  }
}

/**
 * Send a verification email with a code
 */
export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  if (!transporter) {
    console.warn("Email service not initialized. Cannot send verification email.");
    return false;
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Verify Your Email - College Admission Advisor',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4F46E5; text-align: center;">Email Verification</h2>
          <p>Thank you for registering with College Admission Advisor. Please use the verification code below to complete your registration:</p>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${code}</h1>
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">© ${new Date().getFullYear()} College Admission Advisor</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

/**
 * Checks if email service is available
 */
export function isEmailServiceAvailable(): boolean {
  return !!transporter;
}