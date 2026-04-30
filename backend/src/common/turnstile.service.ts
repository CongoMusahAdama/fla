import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
    private readonly logger = new Logger(TurnstileService.name);
    private readonly secretKey: string;
    private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY') || '';
    }

    async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
        if (!token) {
            throw new BadRequestException('Security verification token is missing');
        }

        if (!this.secretKey || this.secretKey === 'your_secret_key_here') {
            this.logger.warn('Cloudflare Turnstile secret key is not configured. Skipping verification.');
            return true; // Allow for now if not configured, but log warning
        }

        try {
            const response = await fetch(this.verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    secret: this.secretKey,
                    response: token,
                    remoteip: remoteIp,
                }),
            });

            const result = await response.json();

            if (result.success) {
                return true;
            } else {
                this.logger.warn(`Turnstile verification failed: ${JSON.stringify(result['error-codes'])}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`Error verifying Turnstile token: ${error.message}`);
            return false;
        }
    }
}
