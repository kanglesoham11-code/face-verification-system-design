import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
    } else {
      console.warn('⚠️  Email service not configured. Emails will be logged to console.');
    }
  }

  async sendVerificationEmail(email: string, name: string, otp: string): Promise<void> {
    const subject = 'Verify your SyncUp account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SyncUp, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address using the OTP below:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with SyncUp, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">SyncUp - Trusted Professional Ecosystem Platform</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to SyncUp!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SyncUp, ${name}!</h2>
        <p>Your email has been verified successfully. You're now part of the trusted professional ecosystem.</p>
        <h3>Next Steps:</h3>
        <ol>
          <li><strong>Complete Face Verification</strong> - Verify your identity to unlock full platform access</li>
          <li><strong>Build Your Profile</strong> - Add your experience, skills, and professional information</li>
          <li><strong>Connect with Professionals</strong> - Start building your network</li>
          <li><strong>Explore Opportunities</strong> - Discover jobs, investments, and partnerships</li>
        </ol>
        <p style="margin-top: 30px;">
          <a href="${env.FRONTEND_URL}/verify-face" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Complete Face Verification
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">SyncUp - Trusted Professional Ecosystem Platform</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      console.log('📧 Email (DEVELOPMENT MODE - Auto-verified):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('📋 Email content preview:');
      console.log(html.replace(/<[^>]*>/g, '').substring(0, 300) + '...');
      console.log('✅ Email simulated successfully (no SMTP configured)');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      console.log('📧 Falling back to console logging (SMTP failed):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('📋 Email content preview:');
      console.log(html.replace(/<[^>]*>/g, '').substring(0, 300) + '...');
      console.log('⚠️  Email delivery failed but registration continues');
      // Don't throw error - allow registration to continue
    }
  }
}

export const emailService = new EmailService();
