import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
    private readonly logger = new Logger(TurnstileService.name);
    private readonly secretKey: string;
    private readonly allowDevBypass: boolean;
    private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    constructor(private configService: ConfigService) {
        const configured = this.configService.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY') || '';
        const isProd = process.env.NODE_ENV === 'production';
        const bypassFlag = (this.configService.get<string>('TURNSTILE_DEV_BYPASS') || '').toLowerCase();

        // Never embed Cloudflare (or any) secrets in source — secret scanners flag them.
        // Local: set CLOUDFLARE_TURNSTILE_SECRET_KEY to match your site key, or TURNSTILE_DEV_BYPASS=true
        // when using Cloudflare's published always-pass test site key.
        this.secretKey =
            !configured || configured === 'your_secret_key_here' ? '' : configured;
        this.allowDevBypass =
            !isProd && (bypassFlag === 'true' || bypassFlag === '1');

        if (!this.secretKey && !isProd) {
            this.logger.warn(
                'CLOUDFLARE_TURNSTILE_SECRET_KEY is unset — Turnstile checks are skipped in non-production.',
            );
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
            if (process.env.NODE_ENV === 'production') {
                this.logger.error('Turnstile secret missing in production — rejecting request.');
                return false;
            }
            this.logger.warn('Cloudflare Turnstile secret key is not configured. Skipping verification.');
            return true;
        }

        try {
            const result = await this.verifyWithSecret(this.secretKey, token, remoteIp);

            if (result.success) {
                return true;
            }

            const errorCodes = result['error-codes'] || [];
            this.logger.warn(`Turnstile verification failed: ${JSON.stringify(errorCodes)}`);

            // Local only: frontend test site key ("For testing only") will not verify against a
            // production secret. Opt in via TURNSTILE_DEV_BYPASS — never enabled in production.
            if (this.allowDevBypass) {
                this.logger.warn(
                    'Accepting request due to TURNSTILE_DEV_BYPASS (non-production). Align site key + secret for real checks.',
                );
                return true;
            }

            return false;
        } catch (error) {
            this.logger.error(`Error verifying Turnstile token: ${error.message}`);
            return false;
        }
    }
}
