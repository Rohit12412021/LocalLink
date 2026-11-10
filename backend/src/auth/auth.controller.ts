import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  SendPhoneVerificationDto,
  VerifyPhoneDto,
  UpdateMeDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UploadsService } from '../uploads/uploads.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('send-phone-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  sendPhoneVerification(
    @Body() body: SendPhoneVerificationDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.authService.sendPhoneVerification(user.userId, body.phone);
  }

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  verifyPhone(@Body() body: VerifyPhoneDto, @CurrentUser() user: JwtPayloadUser) {
    return this.authService.verifyPhone(user.userId, body.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.me(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateMe(
    @Body() body: UpdateMeDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.authService.updateMe(user.userId, body);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(
    @UploadedFile() file?: {
      originalname?: string;
      buffer?: Buffer;
      mimetype?: string;
      size?: number;
    },
    @CurrentUser() user?: JwtPayloadUser,
  ) {
    if (!file || !file.buffer || !user) {
      throw new BadRequestException('No file uploaded');
    }
    const stored = await this.uploadsService.saveImage(
      {
        originalname: file.originalname,
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      },
      'avatars',
    );
    return this.authService.setUserAvatar(user.userId, stored.url);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // ---------------------------------------------------------------------------
  // Google OAuth — the frontend redirects the browser to GET /auth/google
  // ---------------------------------------------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @HttpCode(302)
  googleStart() {
    // Passport performs the redirect to the Google consent screen.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @HttpCode(302)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const profile = req.user as {
      googleId: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
    };

    const appUrl =
      process.env.CORS_ORIGIN || 'http://localhost:3000';
    const frontendCallback = `${appUrl}/auth/callback`;

    try {
      const result = await this.authService.googleLogin(profile);
      return res.redirect(
        `${frontendCallback}?token=${encodeURIComponent(result.accessToken)}`,
      );
    } catch (e) {
      const message = e instanceof Error ? encodeURIComponent(e.message) : 'google_signin_failed';
      return res.redirect(`${frontendCallback}?error=${message}`);
    }
  }
}