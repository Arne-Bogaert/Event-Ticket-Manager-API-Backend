import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  CreateEventRequestDto,
  EventListResponseDto,
  EventResponseDto,
  UpdateEventRequestDto,
} from './dto/events.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('events')
@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Events')
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get a list of all events' })
  @ApiResponse({
    status: 200,
    description: 'Get all events',
    type: EventListResponseDto,
  })
  async findAll(): Promise<EventListResponseDto> {
    return this.eventsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific event' })
  @ApiResponse({
    status: 200,
    description: 'Get event by ID',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The event has been successfully created.',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - You need to be signed in',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have the required role (Admin)',
  })
  async create(@Body() dto: CreateEventRequestDto): Promise<EventResponseDto> {
    return this.eventsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing event (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Update event',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - You need to be signed in',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have the required role (Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventRequestDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Delete event (Success, no content)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - You need to be signed in',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have the required role (Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eventsService.remove(id);
  }
}
