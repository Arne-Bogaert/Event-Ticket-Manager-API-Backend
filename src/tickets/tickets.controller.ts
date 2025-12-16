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
  Res,
} from '@nestjs/common';
import {
  TicketListResponseDto,
  TicketResponseDto,
  CreateTicketRequestDto,
  UpdateTicketRequestDto,
} from './dto/tickets.dto';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { type Session } from '../types/auth';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(AuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Roles(Role.USER, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get tickets (User: own tickets, Admin: all)' })
  @ApiResponse({
    status: 200,
    description: 'List of tickets',
    type: TicketListResponseDto,
  })
  async getAllTickets(
    @CurrentUser() user: Session,
  ): Promise<TicketListResponseDto> {
    return this.ticketsService.findAll(user.id, user.roles);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({
    status: 200,
    description: 'Ticket found',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTicketById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Session,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(id, user.id, user.roles);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buy/Create a ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket created',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createTicket(
    @Body() dto: CreateTicketRequestDto,
    @CurrentUser() user: Session,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.create(dto, user.id);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket updated',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketRequestDto,
    @CurrentUser() user: Session,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.updateById(id, dto, user.id, user.roles);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiResponse({ status: 204, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Session,
  ): Promise<void> {
    return this.ticketsService.remove(id, user.id, user.roles);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download ticket als PDF' })
  @ApiResponse({ status: 200, description: 'PDF bestand wordt gedownload' })
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.ticketsService.generateTicketPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ticket-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
