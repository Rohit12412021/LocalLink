import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const callbackURL =
      config.get<string>('GOOGLE_CALLBACK_URL') ||
      `${config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:4000'}/auth/google/callback`;

    super({
      clientID: clientID || 'disabled',
      clientSecret: clientSecret || 'disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing — Google sign-in disabled until configured in backend/.env',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value?: string }>;
      displayName?: string;
      photos?: Array<{ value?: string }>;
    },
    _done: VerifyCallback,
  ) {
    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value?.toLowerCase() ?? '',
      name: profile.displayName ?? profile.emails?.[0]?.value?.split('@')[0] ?? 'Google User',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}