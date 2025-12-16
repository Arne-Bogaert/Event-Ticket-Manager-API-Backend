import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PublicUserResponseDto } from '../../users/dto/users.dto';
import { Expose, Type } from 'class-transformer';
import { EventResponseDto } from '../../events/dto/events.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({ example: 12, description: 'Unieke ID van het ticket' })
  @Expose()
  id: number;

  @ApiProperty({ example: 50.5, description: 'Prijs van het ticket' })
  @Expose()
  price: number;

  @ApiProperty({ example: 'VIP', description: 'Type ticket' })
  @Expose()
  type: string;

  @ApiProperty({
    type: () => PublicUserResponseDto,
    description: 'Eigenaar van het ticket',
  })
  @Expose()
  user: PublicUserResponseDto;

  @ApiProperty({
    type: () => EventResponseDto,
    description: 'Het event waarvoor dit ticket is',
  })
  @Expose()
  @Type(() => EventResponseDto)
  event: EventResponseDto;
}

export class TicketListResponseDto {
  @ApiProperty({ type: () => [TicketResponseDto] })
  items: TicketResponseDto[];
}

export class CreateTicketRequestDto {
  @ApiProperty({ example: 50.0, description: 'Prijs van het ticket' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Standard', description: 'Ticket type (VIP, etc.)' })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'User ID (Optioneel voor Admin)',
  })
  @IsOptional()
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'Event ID' })
  @IsInt()
  @IsOptional()
  eventId: number;
}

export class UpdateTicketRequestDto {
  @ApiPropertyOptional({ example: 60.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'VIP' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  eventId?: number;
}
