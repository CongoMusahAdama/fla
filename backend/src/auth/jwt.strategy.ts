
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { resolveJwtSecret } from '../common/env-secrets.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['fla_token'];
                    }
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: resolveJwtSecret(),
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
