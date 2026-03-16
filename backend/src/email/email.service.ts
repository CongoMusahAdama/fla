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

    private getStyles() {
        return `
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center; }
            .header-accent { background: linear-gradient(135deg, #D8F800 0%, #E5FF7F 100%); padding: 40px 30px; text-align: center; }
            .logo { width: 60px; height: 60px; background-color: #D8F800; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
            .header h1 { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .header-accent h1 { color: #0f172a; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #1e293b; margin-bottom: 20px; font-weight: 600; }
            .message { font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 30px; }
            .otp-container { background: #f1f5f9; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #cbd5e1; }
            .otp-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
            .otp-code { font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .cta-button { display: inline-block; background-color: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 20px 0; text-align: center; }
            .cta-accent { display: inline-block; background-color: #D8F800; color: #0f172a; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 20px 0; text-align: center; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .status-success { background-color: #ecfdf5; color: #059669; }
            .status-warning { background-color: #fffbeb; color: #d97706; }
            .status-error { background-color: #fef2f2; color: #dc2626; }
        `;
    }

    private wrapLayout(title: string, content: string, useAccentHeader = false) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${this.getStyles()}</style>
            </head>
            <body>
                <div class="container">
                    <div class="${useAccentHeader ? 'header-accent' : 'header'}">
                        ${!useAccentHeader ? '<div class="logo"><span class="logo-text">FLA</span></div>' : ''}
                        <h1>${title}</h1>
                    </div>
                    <div class="content">
                        ${content}
                    </div>
                    <div class="footer">
                        <p><strong>FLA Logistics</strong></p>
                        <p>Your Fashion, Delivered with Excellence</p>
                        <p>© 2026 FLA Logistics. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendOTP(email: string, name: string, otp: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">Welcome to FLA! To activate your business account, please use the verification code below:</p>
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">⏱️ Expires in 10 minutes</p>
                </div>
                <p style="font-size: 13px; color: #94a3b8;">🔒 Security Notice: Never share this code with anyone.</p>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Verify Your FLA Account',
                html: this.wrapLayout('Verify Your Account', content),
            });
        } catch (error: any) {
            console.error('[EmailService] sendOTP Error:', error.message);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string, shopName: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hi ${name},</p>
                <p class="message">Congratulations! Your vendor account for <strong>${shopName}</strong> has been successfully activated.</p>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-button">Go to Vendor Dashboard</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Welcome to FLA, ${shopName}! 🎉`,
                html: this.wrapLayout('Welcome to FLA!', content, true),
            });
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }

    async sendVendorCredentialsEmail(email: string, name: string, password: string, shopName: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Welcome, ${name}!</p>
                <p class="message">Your professional studio account for <strong>${shopName}</strong> is ready.</p>
                <div class="otp-container" style="text-align: left;">
                    <p class="otp-label">Access Email</p>
                    <p style="margin: 5px 0; font-weight: 700;">${email}</p>
                    <p class="otp-label" style="margin-top: 15px;">Temporary Password</p>
                    <p style="margin: 5px 0; font-weight: 700; color: #0f172a;">${password}</p>
                </div>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth?type=login" class="cta-accent">Log In to Studio Hub</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Your FLA Studio Account is Ready: ${shopName} 🚀`,
                html: this.wrapLayout('Studio Account Ready', content),
            });
        } catch (error) {
            console.error('Error sending credentials email:', error);
        }
    }

    async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
        try {
            const resetUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">Please click the button below to reset your password. This link is valid for 1 hour.</p>
                <a href="${resetUrl}" class="cta-button">Reset Password</a>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Reset Your FLA Password 🔒',
                html: this.wrapLayout('Password Reset', content),
            });
        } catch (error) {
            console.error('Error sending reset email:', error);
        }
    }

    async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">Use the following code to reset your password. If you didn't request this, please ignore this email.</p>
                <div class="otp-container">
                    <div class="otp-label">Reset Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: 'Your Password Reset Code 🔒',
                html: this.wrapLayout('Security Verification', content),
            });
        } catch (error) {
            console.error('Error sending reset OTP email:', error);
            throw error;
        }
    }

    async sendOrderEmail(email: string, name: string, orderId: string, amount: number): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">Your order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong> has been placed successfully.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0; color: #64748b;">Total Amount</p>
                    <p style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 5px 0;">GH₵ ${amount.toLocaleString()}</p>
                </div>
                <p class="message">The vendor has been notified and will begin processing your items shortly.</p>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="cta-button">Track Order</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Order Confirmation: #ORD-${orderId.slice(-6).toUpperCase()} 📦`,
                html: this.wrapLayout('Order Received! 🛍️', content),
            });
        } catch (error) {
            console.error('Error sending order email:', error);
        }
    }

    async sendDeliveryFeeEmail(email: string, name: string, orderId: string, fee: number): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">A delivery fee of <strong>GH₵ ${fee}</strong> has been added to your Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong>.</p>
                <p class="message">Please log in to your dashboard to pay this fee so the vendor can proceed with shipping.</p>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="cta-button">Pay Delivery Fee</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Delivery Fee for Order #ORD-${orderId.slice(-6).toUpperCase()} 🚚`,
                html: this.wrapLayout('Delivery Fee Update', content),
            });
        } catch (error) {
            console.error('Error sending delivery fee email:', error);
        }
    }

    async sendAdminOrderNotification(adminEmail: string, orderId: string, amount: number, customerName: string): Promise<void> {
        try {
            const content = `
                <div style="border-left: 4px solid #D8F800; padding-left: 20px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase;">Order ID</p>
                    <p style="font-weight: 700; margin: 5px 0;">#ORD-${orderId.slice(-6).toUpperCase()}</p>
                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase;">Amount</p>
                    <p style="font-weight: 700; margin: 5px 0;">GH₵ ${amount.toLocaleString()}</p>
                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase;">Customer</p>
                    <p style="font-weight: 700; margin: 5px 0;">${customerName}</p>
                </div>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin" class="cta-button">Review in Admin HQ</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: adminEmail,
                subject: `NEW ORDER: #ORD-${orderId.slice(-6).toUpperCase()} (GH₵ ${amount.toLocaleString()})`,
                html: this.wrapLayout('NEW ORDER ALERT 🚨', content),
            });
        } catch (error) {
            console.error('Error sending admin order notification email:', error);
        }
    }

    async sendVendorOrderNotification(vendorEmail: string, shopName: string, orderId: string, amount: number): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${shopName},</p>
                <p class="message">Great news! You have received a new order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong>.</p>
                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #64748b;">Order Amount</p>
                    <p style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 5px 0;">GH₵ ${amount.toLocaleString()}</p>
                </div>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-accent">Manage in Studio</a>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Note: Funds will be released to your wallet once the customer confirms delivery.</p>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: vendorEmail,
                subject: `New Design Order: #ORD-${orderId.slice(-6).toUpperCase()} 🎨`,
                html: this.wrapLayout('New Order Alert! 💰', content),
            });
        } catch (error) {
            console.error('Error sending vendor order notification email:', error);
        }
    }

    async sendGenericNotification(email: string, name: string, subject: string, message: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">${message}</p>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: subject,
                html: this.wrapLayout('Update from FLA', content),
            });
        } catch (error) {
            console.error('Error sending generic notification email:', error);
        }
    }

    async sendAdminDisputeNotification(adminEmail: string, orderId: string, reason: string): Promise<void> {
        try {
            const content = `
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b; font-weight: 700;">Dispute Category: General</p>
                    <p style="margin: 10px 0 0 0; color: #dc2626; font-style: italic;">"${reason}"</p>
                </div>
                <p class="message">Order ID: <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong></p>
                <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin" class="cta-button" style="background-color: #dc2626;">Investigate Dispute</a>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: adminEmail,
                subject: `⚠️ DISPUTE FILED: #ORD-${orderId.slice(-6).toUpperCase()}`,
                html: this.wrapLayout('DISPUTE FILED ⚠️', content),
            });
        } catch (error) {
            console.error('Error sending admin dispute notification email:', error);
        }
    }

    async sendCustomerDisputeResolutionEmail(email: string, name: string, orderId: string, resolution: string): Promise<void> {
        try {
            const content = `
                <p class="greeting">Hello ${name},</p>
                <p class="message">Your dispute for Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong> has been resolved.</p>
                <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #15803d; text-transform: uppercase; font-weight: 800;">Resolution</p>
                    <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 700; color: #166534;">
                        ${resolution === 'refund' ? 'Full Refund Processed' : 'Funds Released to Vendor'}
                    </p>
                </div>
            `;

            await this.resend.emails.send({
                from: this.sender,
                to: email,
                subject: `Dispute Resolution: #ORD-${orderId.slice(-6).toUpperCase()} ✅`,
                html: this.wrapLayout('Dispute Resolved ✅', content),
            });
        } catch (error) {
            console.error('Error sending customer dispute resolution email:', error);
        }
    }
}
