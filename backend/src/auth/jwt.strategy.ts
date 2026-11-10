import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { JwtPayloadUser } from '../common/types/jwt-payload';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  providerId?: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') || 'locallink-dev-secret-change-me',
    });
  }

  validate(payload: JwtPayload): JwtPayloadUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      providerId: payload.providerId ?? null,
    };
  }
}
