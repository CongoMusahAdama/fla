import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
        this.resend = new Resend(apiKey);
    }

    private get sender() {
        return `${this.configService.get<string>('RESEND_SENDER_NAME') || 'FLA Logistics'} <${this.configService.get<string>('RESEND_SENDER_EMAIL') || 'noreply@resend.dev'}>`;
    }

    async sendOTP(email: string, name: string, otp: string): Promise<void> {
        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center; }
                    .logo { width: 60px; height: 60px; background-color: #D8F800; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
                    .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
                    .header h1 { color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
                    .content { padding: 40px 30px; }
                    .greeting { font-size: 18px; color: #1e293b; margin-bottom: 20px; font-weight: 600; }
                    .message { font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 30px; }
                    .otp-container { background: linear-gradient(135deg, #D8F800 0%, #E5FF7F 100%); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0; }
                    .otp-label { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
                    .otp-code { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
                    .expiry { font-size: 13px; color: #475569; margin-top: 15px; }
                    .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
                    .warning p { margin: 0; font-size: 13px; color: #991b1b; }
                    .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { margin: 5px 0; font-size: 13px; color: #94a3b8; }
                    .footer a { color: #0f172a; text-decoration: none; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo"><span class="logo-text">FLA</span></div>
                        <h1>Verify Your Account</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hello ${name},</p>
                        <p class="message">Welcome to FLA Logistics! To complete your registration and activate your business account, please use the verification code below:</p>
                        <div class="otp-container">
                            <div class="otp-label">Your Verification Code</div>
                            <div class="otp-code">${otp}</div>
                            <div class="expiry">⏱️ Expires in 10 minutes</div>
                        </div>
                        <div class="warning">
                            <p><strong>🔒 Security Notice:</strong> Never share this code with anyone. FLA staff will never ask for your verification code.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>FLA Logistics</strong></p>
                        <p>Your Fashion, Delivered with Excellence</p>
                    </div>
                </div>
            </body>
            </html>`;

            const { data, error } = await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Verify Your FLA Vendor Account',
                html: htmlContent,
            });

            if (error) {
                console.error('[EmailService] Resend Error:', error);
                throw new Error('Failed to send verification email');
            }
            console.log(`[EmailService] Registration OTP sent successfully to ${email}`);
        } catch (error: any) {
            console.error('[EmailService] sendOTP Error:', error.message);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string, shopName: string): Promise<void> {
        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #D8F800 0%, #E5FF7F 100%); padding: 40px; text-align: center; }
                    .header h1 { color: #0f172a; font-size: 32px; font-weight: 900; margin: 0; }
                    .content { padding: 40px 30px; }
                    .content p { font-size: 15px; color: #64748b; line-height: 1.6; }
                    .cta-button { display: inline-block; background-color: #0f172a; color: #ffffff; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; margin: 20px 0; }
                    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>🎉 Welcome to FLA!</h1></div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>Congratulations! Your vendor account for <strong>${shopName}</strong> has been successfully verified and activated.</p>
                        <p>You can now start adding your products and reaching customers across our platform.</p>
                        <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-button">Go to Vendor Dashboard</a>
                    </div>
                    <div class="footer"><p>© 2026 FLA Logistics. All rights reserved.</p></div>
                </div>
            </body>
            </html>`;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Welcome to FLA, ${shopName}! 🎉`,
                html: htmlContent,
            });
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }

    async sendVendorCredentialsEmail(email: string, name: string, password: string, shopName: string): Promise<void> {
        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 40px; text-align: center; }
                    .header h1 { color: #D8F800; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                    .content { padding: 50px 40px; }
                    .creds-box { background: #0f172a; border-radius: 24px; padding: 30px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.1); }
                    .cred-label { color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .cred-value { color: #ffffff; font-size: 16px; font-weight: 700; font-family: monospace; }
                    .cta { display: block; background: #D8F800; color: #0f172a; text-align: center; padding: 20px; border-radius: 50px; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
                    .footer { padding: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>FLA STUDIO PARTNER</h1></div>
                    <div class="content">
                        <p>Welcome to the inner circle, ${name}. Your professional studio account is ready.</p>
                        <div class="creds-box">
                            <div class="cred-label">Access Email</div>
                            <div class="cred-value">${email}</div>
                            <div class="cred-label" style="margin-top:15px;">Temporary Password</div>
                            <div class="cred-value" style="color:#D8F800;">${password}</div>
                        </div>
                        <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth?type=login" class="cta">Log In to Studio Hub</a>
                    </div>
                </div>
            </body>
            </html>`;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Your FLA Studio Account is Ready: ${shopName} 🚀`,
                html: htmlContent,
            });
            console.log(`Credentials email sent to ${email}`);
        } catch (error) {
            console.error('Error sending credentials email:', error);
        }
    }

    async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
        try {
            const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center; }
                    .header h1 { color: #D8F800; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                    .content { padding: 40px; }
                    .cta { display: block; background: #D8F800; color: #0f172a; text-align: center; padding: 18px; border-radius: 50px; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>Password Reset</h1></div>
                    <div class="content">
                        <p>Hello ${name}, Please click the button below to reset your password:</p>
                        <a href="${resetUrl}" class="cta">Reset Password</a>
                    </div>
                </div>
            </body>
            </html>`;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Reset Your FLA Password 🔒',
                html: htmlContent,
            });
            console.log(`Reset email sent to ${email}`);
        } catch (error) {
            console.error('Error sending reset email:', error);
        }
    }

    async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<void> {
        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center; }
                    .header h1 { color: #D8F800; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                    .content { padding: 40px; text-align: center; }
                    .otp-box { background: #f1f5f9; border-radius: 20px; padding: 30px; margin: 20px 0; border: 2px dashed #cbd5e1; }
                    .otp-code { font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>Security Verification</h1></div>
                    <div class="content">
                        <p>Hello ${name}, Use the following code to reset your password:</p>
                        <div class="otp-box"><div class="otp-code">${otp}</div></div>
                    </div>
                </div>
            </body>
            </html>`;

            const { data, error } = await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Your Password Reset Code 🔒',
                html: htmlContent,
            });

            if (error) {
                console.error('[EmailService] Resend Reset OTP Error:', error);
                throw new Error('Failed to send reset code');
            }
            console.log(`[EmailService] Password Reset OTP sent successfully to ${email}`);
        } catch (error) {
            console.error('Error sending reset OTP email:', error);
            throw error;
        }
    }
}
