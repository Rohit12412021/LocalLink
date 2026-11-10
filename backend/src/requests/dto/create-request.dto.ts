import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  providerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  providerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  service: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  time: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+0-9\s()-]{7,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  price: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  userId?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
