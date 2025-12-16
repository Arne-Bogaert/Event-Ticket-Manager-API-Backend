import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Response DTO
export class LocationResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Sportpaleis' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Schijnpoortweg 119' })
  @Expose()
  street: string;

  @ApiProperty({ example: 'Antwerpen' })
  @Expose()
  city: string;

  @ApiProperty({ example: '2170', name: 'postal_code' })
  @Expose({ name: 'postal_code' })
  postalCode: string;

  @ApiProperty({ example: 'Belgium' })
  @Expose()
  country: string;
}

export class LocationListResponseDto {
  @ApiProperty({ type: () => [LocationResponseDto] })
  @Expose()
  items: LocationResponseDto[];
}

// Request DTO
export class CreateLocationDto {
  @ApiProperty({ example: 'Sportpaleis', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Schijnpoortweg 119', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: 'Antwerpen', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiProperty({ example: '2170', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ example: 'Belgium', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Sportpaleis' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Schijnpoortweg 119' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({ example: 'Antwerpen' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @ApiPropertyOptional({ example: '2170' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Belgium' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
