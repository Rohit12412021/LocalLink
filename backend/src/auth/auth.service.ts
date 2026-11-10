import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserRole } from '../common/enums/user-role.enum';
import { suggestServicePrice } from '../common/utils/geo.util';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateMeDto,
} from './dto/auth.dto';

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type AuthUserDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role: UserRole;
  providerId: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  authMethod: 'password' | 'google';
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role =
      dto.role === UserRole.Provider ? UserRole.Provider : UserRole.User;
    const emailVerificationToken = uuid();

    const user = this.usersRepo.create({
      name: dto.name.trim(),
      email,
      passwordHash,
      phone: dto.phone?.trim() || null,
      location: dto.location?.trim() || null,
      role,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      authMethod: 'password',
    });
    await this.usersRepo.save(user);

    // Fire-and-forget — don't block registration if email fails
    this.notificationsService.sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken,
    ).catch(err => console.error('[Auth] Failed to send verification email:', err));

    let providerId: string | null = null;

    if (role === UserRole.Provider) {
      const category = dto.category!.trim();
      const priceHint = suggestServicePrice(category).suggested;
      const provider = this.providersRepo.create({
        name: dto.businessName!.trim(),
        category,
        location: dto.location?.trim() || 'India',
        rating: 5,
        reviewCount: 0,
        distance: null,
        price: priceHint,
        available: true,
        phone: dto.phone?.trim() || null,
        whatsapp: dto.phone?.trim() || null,
        experience: 'New on LocalLink',
        about: `${dto.businessName!.trim()} — trusted local ${category.toLowerCase()} services on LocalLink.`,
        latitude: 28.205,
        longitude: 76.795,
        userId: user.id,
        services: [],
      });
      await this.providersRepo.save(provider);

      const starter = this.servicesRepo.create({
        name: `General ${category} Service`,
        price: priceHint,
        description: 'Starting package — edit this from your dashboard.',
        providerId: provider.id,
      });
      await this.servicesRepo.save(starter);
      providerId = provider.id;
    }

    return {
      user: {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        providerId,
        avatarUrl: user.avatarUrl,
        emailVerified: false,
        phoneVerified: user.phoneVerified,
        authMethod: 'password',
      },
      emailVerified: false,
      message:
        'Registration successful! Please check your email to verify your account before logging in.',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    const provider = await this.providersRepo.findOne({
      where: { userId: user.id },
    });

    return this.buildAuthResponse(user, provider?.id ?? null);
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const provider = await this.providersRepo.findOne({
      where: { userId: user.id },
    });
    return this.toUserDto(user, provider?.id ?? null);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<AuthUserDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || null;
    if (dto.location !== undefined)
      user.location = dto.location.trim() || null;

    await this.usersRepo.save(user);

    const provider = await this.providersRepo.findOne({
      where: { userId: user.id },
    });
    return this.toUserDto(user, provider?.id ?? null);
  }

  async setUserAvatar(userId: string, avatarUrl: string): Promise<AuthUserDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.avatarUrl = avatarUrl;
    await this.usersRepo.save(user);

    const provider = await this.providersRepo.findOne({
      where: { userId: user.id },
    });
    if (provider && !provider.avatarUrl) {
      provider.avatarUrl = avatarUrl;
      await this.providersRepo.save(provider);
    }

    return this.toUserDto(user, provider?.id ?? null);
  }

  async resendVerificationEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email: normalized } });

    if (!user) {
      return {
        message:
          'If an account exists with this email, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    const token = uuid();
    await this.usersRepo.update(user.id, {
      emailVerificationToken: token,
      emailVerificationExpiry: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    });
    await this.notificationsService.sendVerificationEmail(
      user.email,
      user.name,
      token,
    );

    return { message: 'Verification email sent successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const resetToken = uuid();
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.usersRepo.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry,
    });

    await this.notificationsService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (
      !user ||
      !user.passwordResetExpiry ||
      user.passwordResetExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.usersRepo.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    await this.notificationsService.sendPasswordChangedEmail(
      user.email,
      user.name,
    );

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersRepo.findOne({
      where: { emailVerificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (
      user.emailVerificationExpiry &&
      user.emailVerificationExpiry < new Date()
    ) {
      throw new BadRequestException(
        'This verification link has expired. Please request a new one.',
      );
    }

    await this.usersRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    });

    return { message: 'Email verified successfully' };
  }

  async sendPhoneVerification(userId: string, phone: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepo.update(user.id, {
      phoneVerificationCode: code,
      phoneVerificationExpiry: expiry,
      phone: phone.trim(),
    });

    if (process.env.SMS_PROVIDER && process.env.SMS_PROVIDER !== 'ethereal') {
      try {
        // Wait for actual SMS provider to be wired — reserved integration point
        // e.g. Twilio: client.messages.create({ to, from, body })
        void process.env.SMS_PROVIDER;
      } catch (e) {
        console.error('[SMS Error]', e);
      }
    } else {
      console.log(`[SMS Simulator] Phone: ${phone}, Code: ${code}`);
    }

    return {
      message: process.env.SMS_PROVIDER
        ? 'Verification code sent to your phone'
        : 'Demo mode: verification code logged on the API console',
    };
  }

  async verifyPhone(userId: string, code: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      throw new BadRequestException('No verification code sent');
    }

    if (user.phoneVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    if (user.phoneVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersRepo.update(user.id, {
      phoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null,
    });

    return { message: 'Phone verified successfully' };
  }

  /**
   * Handle a verified Google profile: find an existing account matching the
   * Google id (or the verified email) and create one if it doesn't exist.
   * Google sign-ins Create Customer accounts — providers keep their business data.
   */
  async googleLogin(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  }) {
    if (!profile.googleId || !profile.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user =
      (await this.usersRepo.findOne({
        where: { googleId: profile.googleId },
      })) ||
      (await this.usersRepo.findOne({ where: { email: profile.email } }));

    if (!user) {
      user = this.usersRepo.create({
        name: profile.name,
        email: profile.email,
        passwordHash: '', // no password for OAuth accounts
        role: UserRole.User,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl || null,
        emailVerified: true,
        authMethod: 'google',
      });
      await this.usersRepo.save(user);
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = profile.googleId;
        changed = true;
      }
      if (user.avatarUrl !== profile.avatarUrl && profile.avatarUrl) {
        user.avatarUrl = profile.avatarUrl;
        changed = true;
      }
      if (user.email && !user.emailVerified) {
        user.emailVerified = true;
        changed = true;
      }
      if (changed) {
        await this.usersRepo.save(user);
      }
    }

    const provider = await this.providersRepo.findOne({
      where: { userId: user.id },
    });

    return this.buildAuthResponse(user, provider?.id ?? null);
  }

  private toUserDto(user: UserEntity, providerId: string | null): AuthUserDto {
    return {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      providerId,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      authMethod: (user.authMethod ?? 'password') as 'password' | 'google',
    };
  }

  private async buildAuthResponse(
    user: UserEntity,
    providerId: string | null,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providerId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.toUserDto(user, providerId),
    };
  }
}