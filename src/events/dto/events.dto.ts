import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  IsOptional,
  Matches,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/categories.dto';

//Response DTOs
export class PublicLocationResponseDto {
  @ApiProperty({ example: 1, description: 'ID van de locatie' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Sportpaleis', description: 'Naam van de locatie' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Antwerpen', description: 'Stad van de locatie' })
  @Expose()
  city: string;
}

export class EventResponseDto {
  @ApiProperty({ example: 1, description: 'Unieke ID van het event' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Rock Werchter', description: 'Naam van het event' })
  @Expose()
  name: string;

  @ApiProperty({ example: '2024-07-01', description: 'Datum van het event' })
  @Expose()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: '20:00:00', description: 'Starttijd' })
  @Expose({ name: 'start_time' })
  startTime: string;

  @ApiProperty({ example: '23:00:00', description: 'Eindtijd' })
  @Expose({ name: 'end_time' })
  endTime: string;

  @ApiProperty({ type: () => PublicLocationResponseDto })
  @Expose()
  @Type(() => PublicLocationResponseDto)
  location: PublicLocationResponseDto;

  @ApiProperty({ type: () => [CategoryResponseDto] })
  @Expose()
  @Type(() => CategoryResponseDto)
  categories: CategoryResponseDto[];
}

export class EventListResponseDto {
  @ApiProperty({ type: () => [EventResponseDto] })
  @Expose()
  @Type(() => EventResponseDto)
  items: EventResponseDto[];
}

// Request DTOs
export class CreateEventRequestDto {
  @ApiProperty({
    example: 'Rock Werchter',
    description: 'De naam van het event',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: '2024-07-01',
    description: 'De datum (ISO 8601)',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '20:00:00',
    description: 'Starttijd',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format',
  })
  startTime: string;

  @ApiProperty({
    example: '23:00:00',
    description: 'Eindtijd',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format',
  })
  endTime: string;

  @ApiProperty({ example: 1, description: 'Locatie ID', minimum: 1 })
  @IsInt()
  @Min(1)
  locationId: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Categorie IDs',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}

export class UpdateEventRequestDto {
  @ApiPropertyOptional({ example: 'Rock Werchter', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '2024-07-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '20:00:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
  startTime?: string;

  @ApiPropertyOptional({ example: '23:00:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
  endTime?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  locationId?: number;

  @ApiPropertyOptional({ example: [1, 2], type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}
