// src/users/dto/users.dto.ts
import { Expose, Type } from 'class-transformer';
import { TicketResponseDto } from '../../tickets/dto/tickets.dto';
import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsIn,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // 👈 Import toevoegen

// Response DTOs
export class PublicUserResponseDto {
  @ApiProperty({ example: 1, description: 'Unieke ID van de user' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Arne Bogaert', description: 'Volledige naam' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'arne@example.com', description: 'Emailadres' })
  @Expose()
  email: string;
}

export class UserListResponseDto {
  @ApiProperty({
    type: () => [PublicUserResponseDto],
    description: 'Lijst van gebruikers',
  })
  @Expose()
  @Type(() => PublicUserResponseDto)
  items: PublicUserResponseDto[];
}

export class UserDetailResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Arne Bogaert' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'arne@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'user', enum: ['admin', 'user'] })
  @Expose()
  role: string;

  @ApiProperty({
    type: () => [TicketResponseDto],
    description: 'Lijst van tickets van deze user',
  })
  @Expose()
  @Type(() => TicketResponseDto)
  tickets: TicketResponseDto[];
}

// Request DTOs

export class RegisterUserRequestDto {
  @ApiProperty({
    example: 'Arne Bogaert',
    description: 'Volledige naam',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'arne@example.com',
    description: 'Geldig emailadres',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'superSecret123',
    description: 'Wachtwoord (min 8 tekens)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class CreateUserDto extends RegisterUserRequestDto {
  @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user'] })
  @IsOptional()
  @IsIn(['admin', 'user'])
  role?: 'admin' | 'user';
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Arne Bogaert', minLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ example: 'nieuw@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'nieuwWachtwoord123', minLength: 6 })
  @IsOptional()
  @IsString()
  @Length(6, 100)
  password?: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['admin', 'user'] })
  @IsOptional()
  @IsIn(['admin', 'user'])
  role?: 'admin' | 'user';
}
