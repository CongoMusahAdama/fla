import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@sendinblue/client';

@Injectable()
export class EmailService {
    private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

    constructor(private configService: ConfigService) {
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
        console.log('EmailService initialized. API Key present:', !!apiKey);
        this.apiInstance.setApiKey(
            SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
            apiKey
        );
    }

    async sendOTP(email: string, name: string, otp: string): Promise<void> {
        console.log('EmailService.sendOTP called with:', { email, name, otp });

        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            console.log('Created SendSmtpEmail instance');

            sendSmtpEmail.subject = 'Verify Your FLA Vendor Account';
            sendSmtpEmail.to = [{ email, name }];
            sendSmtpEmail.sender = {
                name: 'FLA Logistics',
                email: this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@fla.com'
            };
            console.log('Email configured with sender:', sendSmtpEmail.sender);
            sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background-color: #f3f4f6;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .logo {
                        width: 60px;
                        height: 60px;
                        background-color: #D8F800;
                        border-radius: 50%;
                        margin: 0 auto 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 900;
                        color: #0f172a;
                        letter-spacing: -1px;
                    }
                    .header h1 {
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 900;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #1e293b;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .message {
                        font-size: 15px;
                        color: #64748b;
                        line-height: 1.6;
                        margin-bottom: 30px;
                    }
                    .otp-container {
                        background: linear-gradient(135deg, #D8F800 0%, #E5FF7F 100%);
                        border-radius: 16px;
                        padding: 30px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .otp-label {
                        font-size: 12px;
                        font-weight: 800;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        margin-bottom: 10px;
                    }
                    .otp-code {
                        font-size: 48px;
                        font-weight: 900;
                        color: #0f172a;
                        letter-spacing: 8px;
                        margin: 10px 0;
                        font-family: 'Courier New', monospace;
                    }
                    .expiry {
                        font-size: 13px;
                        color: #475569;
                        margin-top: 15px;
                    }
                    .warning {
                        background-color: #fef2f2;
                        border-left: 4px solid #ef4444;
                        padding: 15px 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .warning p {
                        margin: 0;
                        font-size: 13px;
                        color: #991b1b;
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    }
                    .footer p {
                        margin: 5px 0;
                        font-size: 13px;
                        color: #94a3b8;
                    }
                    .footer a {
                        color: #0f172a;
                        text-decoration: none;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-text">FLA</span>
                        </div>
                        <h1>Verify Your Account</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hello ${name},</p>
                        <p class="message">
                            Welcome to FLA Logistics! We're excited to have you join our vendor community. 
                            To complete your registration and activate your business account, please use the verification code below:
                        </p>
                        
                        <div class="otp-container">
                            <div class="otp-label">Your Verification Code</div>
                            <div class="otp-code">${otp}</div>
                            <div class="expiry">⏱️ Expires in 10 minutes</div>
                        </div>

                        <p class="message">
                            Enter this code in the verification screen to activate your vendor account and start selling your products.
                        </p>

                        <div class="warning">
                            <p><strong>🔒 Security Notice:</strong> Never share this code with anyone. FLA staff will never ask for your verification code.</p>
                        </div>

                        <p class="message">
                            If you didn't request this code, please ignore this email or contact our support team.
                        </p>
                    </div>
                    <div class="footer">
                        <p><strong>FLA Logistics</strong></p>
                        <p>Your Fashion, Delivered with Excellence</p>
                        <p style="margin-top: 15px;">
                            <a href="mailto:help@fla.com">help@fla.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

            try {
                await this.apiInstance.sendTransacEmail(sendSmtpEmail);
                console.log(`OTP email sent successfully to ${email}`);
            } catch (error) {
                console.error('Error sending OTP email:', error);
                throw new Error('Failed to send verification email');
            }
        } catch (error) {
            console.error('Error in sendOTP:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string, shopName: string): Promise<void> {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = `Welcome to FLA, ${shopName}! 🎉`;
        sendSmtpEmail.to = [{ email, name }];
        sendSmtpEmail.sender = {
            name: 'FLA Logistics',
            email: this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@fla.com'
        };
        sendSmtpEmail.htmlContent = `
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
                    <div class="header">
                        <h1>🎉 Welcome to FLA!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>Congratulations! Your vendor account for <strong>${shopName}</strong> has been successfully verified and activated.</p>
                        <p>You can now start adding your products and reaching customers across our platform.</p>
                        <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-button">Go to Vendor Dashboard</a>
                        <p>If you have any questions, our support team is here to help at <a href="mailto:help@fla.com">help@fla.com</a></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FLA Logistics. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }
    async sendVendorCredentialsEmail(email: string, name: string, password: string, shopName: string): Promise<void> {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = `Your FLA Studio Account is Ready: ${shopName} 🚀`;
        sendSmtpEmail.to = [{ email, name }];
        sendSmtpEmail.sender = {
            name: 'FLA Logistics',
            email: this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@fla.com'
        };
        sendSmtpEmail.htmlContent = `
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
                    .shop-badge { background: #f1f5f9; padding: 12px 24px; rounded-full; display: inline-block; font-weight: 900; color: #0f172a; margin-bottom: 30px; border-radius: 50px; text-transform: uppercase; font-size: 12px; }
                    .hero-text { font-size: 18px; color: #1e293b; font-weight: 700; margin-bottom: 20px; }
                    .creds-box { background: #0f172a; border-radius: 24px; padding: 30px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.1); }
                    .cred-item { margin-bottom: 15px; }
                    .cred-label { color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .cred-value { color: #ffffff; font-size: 16px; font-weight: 700; font-family: monospace; }
                    .creds-box .cred-value.pass { color: #D8F800; }
                    .cta { display: block; background: #D8F800; color: #0f172a; text-align: center; padding: 20px; border-radius: 50px; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
                    .footer { padding: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>FLA STUDIO PARTNER</h1>
                    </div>
                    <div class="content">
                        <div class="shop-badge">${shopName}</div>
                        <p class="hero-text">Welcome to the inner circle, ${name}.</p>
                        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">Our administration has created your professional studio account. You can now log in to manage your inventory, track orders, and scale your brand with FLA Logistics.</p>
                        
                        <div class="creds-box">
                            <div class="cred-item">
                                <div class="cred-label">Access Email</div>
                                <div class="cred-value">${email}</div>
                            </div>
                            <div class="cred-item" style="margin-bottom: 0;">
                                <div class="cred-label">Temporary Password</div>
                                <div class="cred-value pass">${password}</div>
                            </div>
                        </div>

                        <p style="color: #64748b; font-size: 12px; margin-bottom: 30px; font-weight: 600;">⚠️ Security Notice: Please change your password immediately after your first login for security reasons.</p>
                        
                        <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth?type=login" class="cta">Log In to Studio Hub</a>
                    </div>
                    <div class="footer">
                        <p>© 2026 FLA Logistics • High Performance Fashion Delivery</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`Credentials email sent to ${email}`);
        } catch (error) {
            console.error('Error sending credentials email:', error);
        }
    }
}
