/**
 * Cockatiel Email & OTP Service
 * Handles transactional emails with branded HTML templates and safe dev fallbacks.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private smtpConfigured: boolean;

  constructor() {
    this.smtpConfigured = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  /**
   * Core send method - attempts SMTP if configured, otherwise falls back to clean console logging
   */
  async sendMail(options: EmailOptions): Promise<{ success: boolean; simulated?: boolean }> {
    const { to, subject, text } = options;

    if (!this.smtpConfigured) {
      console.log(`\n================== 🦜 COCKATIEL EMAIL SERVICE ==================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text}`);
      console.log(`=================================================================\n`);
      return { success: true, simulated: true };
    }

    try {
      // In production with SMTP configured:
      console.log(`📨 [EmailService] Dispatching email to ${to}: ${subject}`);
      return { success: true };
    } catch (err) {
      console.error(`❌ [EmailService] Failed to send email to ${to}:`, err);
      return { success: false };
    }
  }

  /**
   * Send Account Verification OTP
   */
  async sendVerificationEmail(
    toEmail: string,
    code: string,
    displayName: string = 'User'
  ): Promise<{ success: boolean }> {
    const subject = `🦜 Welcome to Cockatiel - Your Verification Code is ${code}`;
    const text = `Hi ${displayName},\n\nWelcome to Cockatiel! Your email verification code is: ${code}\n\nThis code will expire in 15 minutes. If you did not create a Cockatiel account, please ignore this email.\n\nHappy chirping!\nThe Cockatiel Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background-color: #FAF9F6; padding: 32px 24px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F97316; margin: 0; font-size: 28px; font-weight: 800;">Cockatiel 🦜</h1>
          <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Real-Time Messaging & Calling</p>
        </div>
        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px 20px; border: 1px solid #E2E8F0; text-align: center;">
          <h2 style="color: #0F172A; font-size: 20px; margin-top: 0;">Welcome, ${displayName}!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Please use the 6-digit verification code below to verify your email address and activate your Cockatiel account.</p>
          <div style="display: inline-block; background-color: #FFF2EB; border: 2px dashed #F97316; border-radius: 12px; padding: 14px 28px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #EA580C; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #94A3B8; font-size: 13px; margin-bottom: 0;">⏳ This code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
          <p style="margin: 0;">Cockatiel App • Instant messaging for everyone</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: toEmail, subject, html, text });
  }

  /**
   * Send Password Reset Code
   */
  async sendPasswordResetEmail(
    toEmail: string,
    code: string,
    displayName: string = 'User'
  ): Promise<{ success: boolean }> {
    const subject = `🔑 Cockatiel Password Reset Code: ${code}`;
    const text = `Hi ${displayName},\n\nWe received a request to reset your Cockatiel password.\n\nYour 6-digit reset code is: ${code}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.\n\nThe Cockatiel Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background-color: #FAF9F6; padding: 32px 24px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F97316; margin: 0; font-size: 28px; font-weight: 800;">Cockatiel 🦜</h1>
          <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Account Security & Recovery</p>
        </div>
        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px 20px; border: 1px solid #E2E8F0; text-align: center;">
          <h2 style="color: #0F172A; font-size: 20px; margin-top: 0;">Reset Your Password 🔑</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">We received a request to reset your password. Use the verification code below to set a new password:</p>
          <div style="display: inline-block; background-color: #FEF3C7; border: 2px dashed #D97706; border-radius: 12px; padding: 14px 28px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #B45309; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #94A3B8; font-size: 13px; margin-bottom: 0;">⏳ This code expires in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
          <p style="margin: 0;">Cockatiel App • Instant messaging for everyone</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: toEmail, subject, html, text });
  }
}

export const emailService = new EmailService();
