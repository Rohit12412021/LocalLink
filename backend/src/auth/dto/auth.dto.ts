import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  Length,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  /** Only Customer or Provider — each uses their own email */
  @IsIn([UserRole.User, UserRole.Provider], {
    message: 'role must be User or Provider',
  })
  role: UserRole.User | UserRole.Provider;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.Provider)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  businessName?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.Provider)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)',
  })
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class SendPhoneVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;
}

export class VerifyPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
