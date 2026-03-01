
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret || 'temporary-secret-key-to-prevent-crash',
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
