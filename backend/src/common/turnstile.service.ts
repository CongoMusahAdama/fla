import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Cloudflare Turnstile always-pass test secret — pairs with site key 1x00000000000000000000AA. */
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

@Injectable()
export class TurnstileService {
    private readonly logger = new Logger(TurnstileService.name);
    private readonly secretKey: string;
    private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    constructor(private configService: ConfigService) {
        const configured = this.configService.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY') || '';
        const isProd = process.env.NODE_ENV === 'production';

        if (!configured || configured === 'your_secret_key_here') {
            this.secretKey = isProd ? '' : TURNSTILE_TEST_SECRET;
        } else {
            this.secretKey = configured;
        }
    }

    private async verifyWithSecret(secret: string, token: string, remoteIp?: string) {
        const response = await fetch(this.verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret,
                response: token,
                ...(remoteIp ? { remoteip: remoteIp } : {}),
            }),
        });
        return response.json() as Promise<{ success?: boolean; 'error-codes'?: string[] }>;
    }

    async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
        if (!token) {
            throw new BadRequestException('Security verification token is missing');
        }

        if (!this.secretKey) {
            this.logger.warn('Cloudflare Turnstile secret key is not configured. Skipping verification.');
            return true;
        }

        try {
            let result = await this.verifyWithSecret(this.secretKey, token, remoteIp);

            if (result.success) {
                return true;
            }

            const errorCodes = result['error-codes'] || [];
            this.logger.warn(`Turnstile verification failed: ${JSON.stringify(errorCodes)}`);

            // Local/dev: frontend often uses Cloudflare's always-pass test site key
            // (shows "For testing only") while backend .env has a production secret.
            // That mismatch returns invalid-input-response — retry with the matching test secret.
            const isProd = process.env.NODE_ENV === 'production';
            if (!isProd && this.secretKey !== TURNSTILE_TEST_SECRET) {
                result = await this.verifyWithSecret(TURNSTILE_TEST_SECRET, token, remoteIp);
                if (result.success) {
                    this.logger.warn(
                        'Turnstile passed with Cloudflare TEST secret. For local dev, either set NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY to your real site key, or set CLOUDFLARE_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA.',
                    );
                    return true;
                }
                this.logger.warn(
                    `Turnstile test-secret retry also failed: ${JSON.stringify(result['error-codes'] || [])}`,
                );
            }

            return false;
        } catch (error) {
            this.logger.error(`Error verifying Turnstile token: ${error.message}`);
            return false;
        }
    }
}
