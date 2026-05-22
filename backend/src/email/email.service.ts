import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@sendinblue/client';

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name);
    private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    }

    onModuleInit() {
        const apiKey = this.configService.get<string>('BREVO_API_KEY');
        const { name, email } = this.sender;
        if (!apiKey) {
            this.logger.warn('BREVO_API_KEY is not set — transactional emails will fail.');
        } else {
            this.logger.log(`Brevo ready. Sender must be verified in Brevo dashboard: "${name}" <${email}>`);
        }
    }

    private get sender() {
        return {
            name: this.configService.get<string>('BREVO_SENDER_NAME') || 'FLA Purchase',
            email: this.configService.get<string>('BREVO_SENDER_EMAIL') || 'security@flamingo-store1.com',
        };
    }

    private formatBrevoError(error: any): string {
        const body = error?.response?.body;
        if (typeof body === 'string') return body;
        if (body?.message) return body.message;
        if (body?.code) return `${body.code}: ${JSON.stringify(body)}`;
        return error?.message || 'Unknown Brevo error';
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
                        <p><strong>FLA Purchase</strong></p>
                        <p>Your Fashion, Delivered with Excellence</p>
                        <p>© 2026 FLA Purchase. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private async sendEmail(to: string | string[], subject: string, htmlContent: string): Promise<void> {
        const apiKey = this.configService.get<string>('BREVO_API_KEY');
        if (!apiKey) {
            this.logger.error('BREVO_API_KEY is missing. Email not sent.');
            throw new Error('Email service is not configured (BREVO_API_KEY missing)');
        }

        try {
            const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];

            await this.apiInstance.sendTransacEmail({
                sender: this.sender,
                to: recipients,
                subject,
                htmlContent,
            });

            this.logger.log(
                `Email sent via Brevo [${subject}] from ${this.sender.email} to ${Array.isArray(to) ? to.join(', ') : to}`,
            );
        } catch (error: any) {
            const detail = this.formatBrevoError(error);
            this.logger.error(
                `Brevo send failed [${subject}] from "${this.sender.name}" <${this.sender.email}> ` +
                `to ${Array.isArray(to) ? to.join(', ') : to}. ${detail}`,
            );
            if (
                detail.toLowerCase().includes('sender') ||
                detail.toLowerCase().includes('not valid') ||
                detail.toLowerCase().includes('authenticated')
            ) {
                this.logger.error(
                    `Add and verify sender "${this.sender.email}" under Brevo → Senders, Domains & Dedicated IPs (authenticate domain flamingo-store1.com first).`,
                );
            }
            throw new Error(detail);
        }
    }

    async sendOTP(email: string, name: string, otp: string): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Welcome to FLA! To verify your vendor email and activate your studio account, use the code below:</p>
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">Expires in 10 minutes</p>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">Never share this code with anyone.</p>
        `;

        await this.sendEmail(email, 'Verify Your FLA Vendor Email', this.wrapLayout('Verify Your Account', content));
    }

    async sendWelcomeEmail(email: string, name: string, shopName: string): Promise<void> {
        const content = `
            <p class="greeting">Hi ${name},</p>
            <p class="message">Your vendor account for <strong>${shopName}</strong> is verified. Your application is under admin review — we'll notify you once your studio is approved.</p>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-button">Go to Vendor Dashboard</a>
        `;

        await this.sendEmail(email, `Welcome to FLA, ${shopName}!`, this.wrapLayout('Welcome to FLA!', content, true));
    }

    async sendVendorCredentialsEmail(email: string, name: string, password: string, shopName: string): Promise<void> {
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

        await this.sendEmail(email, `Your FLA Studio Account is Ready: ${shopName}`, this.wrapLayout('Studio Account Ready', content));
    }

    async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
        const resetUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Please click the button below to reset your password. This link is valid for 1 hour.</p>
            <a href="${resetUrl}" class="cta-button">Reset Password</a>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
        `;

        await this.sendEmail(email, 'Reset Your FLA Password', this.wrapLayout('Password Reset', content));
    }

    async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Use the following code to reset your password.</p>
            <div class="otp-container">
                <div class="otp-label">Reset Code</div>
                <div class="otp-code">${otp}</div>
            </div>
        `;

        await this.sendEmail(email, 'Your Password Reset Code', this.wrapLayout('Security Verification', content));
    }

    async sendOrderEmail(email: string, name: string, orderId: string, amount: number): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Your order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong> has been placed successfully.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b;">Total Amount</p>
                <p style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 5px 0;">GH₵ ${amount.toLocaleString()}</p>
            </div>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="cta-button">Track Order</a>
        `;

        await this.sendEmail(email, `Order Confirmation: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('Order Received!', content));
    }

    async sendDeliveryFeeEmail(email: string, name: string, orderId: string, fee: number): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">A delivery fee of <strong>GH₵ ${fee}</strong> has been added to your Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong>.</p>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="cta-button">Pay Delivery Fee</a>
        `;

        await this.sendEmail(email, `Delivery Fee for Order #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('Delivery Fee Update', content));
    }

    async sendAdminOrderNotification(adminEmail: string, orderId: string, amount: number, customerName: string): Promise<void> {
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

        await this.sendEmail(adminEmail, `NEW ORDER: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('NEW ORDER ALERT', content));
    }

    async sendVendorOrderNotification(vendorEmail: string, shopName: string, orderId: string, amount: number): Promise<void> {
        const content = `
            <p class="greeting">Hello ${shopName},</p>
            <p class="message">You have received a new order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong>.</p>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/vendor" class="cta-accent">Manage in Studio</a>
        `;

        await this.sendEmail(vendorEmail, `New Order: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('New Order Alert!', content));
    }

    async sendGenericNotification(email: string, name: string, subject: string, message: string): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">${message}</p>
        `;

        await this.sendEmail(email, subject, this.wrapLayout('Update from FLA', content));
    }

    async sendAdminDisputeNotification(adminEmail: string, orderId: string, reason: string): Promise<void> {
        const content = `
            <p>Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong></p>
            <p>${reason}</p>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin" class="cta-button">Investigate Dispute</a>
        `;

        await this.sendEmail(adminEmail, `DISPUTE FILED: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('DISPUTE FILED', content));
    }

    async sendCustomerDisputeResolutionEmail(email: string, name: string, orderId: string, resolution: string): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Your dispute for Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong> has been resolved: ${resolution === 'refund' ? 'Full Refund Processed' : 'Funds Released to Vendor'}.</p>
        `;

        await this.sendEmail(email, `Dispute Resolution: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('Dispute Resolved', content));
    }

    async sendDisputeNotification(recipients: string[], orderId: string, reason: string, customerName: string, vendorName: string): Promise<void> {
        const content = `
            <p>A dispute has been filed for Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong>.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Vendor:</strong> ${vendorName}</p>
        `;

        await this.sendEmail(recipients, `DISPUTE CASE: #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('DISPUTE INVESTIGATION', content));
    }

    async sendSkynetHandoverEmail(email: string, name: string, orderId: string, trackingNumber: string): Promise<void> {
        const content = `
            <p class="greeting">Hello ${name},</p>
            <p class="message">Order <strong>#ORD-${orderId.slice(-6).toUpperCase()}</strong> has been received by Skynet Express. Tracking: <strong>${trackingNumber}</strong></p>
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" class="cta-accent">Track on FLA</a>
        `;

        await this.sendEmail(email, `Skynet Handover: Order #ORD-${orderId.slice(-6).toUpperCase()}`, this.wrapLayout('Logistics Handover', content, true));
    }
}
