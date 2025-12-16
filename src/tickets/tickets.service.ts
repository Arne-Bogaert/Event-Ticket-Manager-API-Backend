/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';

import {
  CreateTicketRequestDto,
  TicketListResponseDto,
  TicketResponseDto,
  UpdateTicketRequestDto,
} from './dto/tickets.dto';

import { tickets } from '../drizzle/schema';
import * as drizzleProvider from '../drizzle/drizzle.provider';
import { Role } from '../auth/roles';

import PDFDocument from 'pdfkit';
import { events } from '../drizzle/schema';
import type { Response } from 'express';

@Injectable()
export class TicketsService {
  constructor(
    @drizzleProvider.InjectDrizzle()
    private readonly db: drizzleProvider.DatabaseProvider,
  ) {}

  async getById(id: number): Promise<TicketResponseDto> {
    const ticket = await this.db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: { user: true, event: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket met id ${id} niet gevonden`);
    }

    const mappedTicket = {
      id: ticket.id,
      price: Number(ticket.price),
      type: ticket.type,
      user: ticket.user,
      event: ticket.event,
    };

    return plainToInstance(TicketResponseDto, mappedTicket, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    _userId: number,
    _userRoles: Role[],
  ): Promise<TicketListResponseDto> {
    const rows = await this.db.query.tickets.findMany({
      with: { user: true, event: true },
    });

    const items = rows.map((ticket) => ({
      id: ticket.id,
      price: Number(ticket.price),
      type: ticket.type,
      user: ticket.user,
      event: ticket.event,
    }));

    return {
      items: plainToInstance(TicketResponseDto, items, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findOne(
    id: number,
    _userId: number,
    _userRoles: Role[],
  ): Promise<TicketResponseDto> {
    const ticket = await this.db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: { user: true, event: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket met id ${id} niet gevonden`);
    }

    const mappedTicket = {
      id: ticket.id,
      price: Number(ticket.price),
      type: ticket.type,
      user: ticket.user,
      event: ticket.event,
    };

    return plainToInstance(TicketResponseDto, mappedTicket, {
      excludeExtraneousValues: true,
    });
  }

  async create(
    dto: CreateTicketRequestDto,
    userId: number,
  ): Promise<TicketResponseDto> {
    const [newTicketId] = await this.db
      .insert(tickets)
      .values({
        price: String(dto.price),
        type: dto.type,
        user_id: userId,
        event_id: dto.eventId,
      })
      .$returningId();

    return this.getById(newTicketId.id);
  }

  async updateById(
    id: number,
    changes: UpdateTicketRequestDto,
    _userId: number,
    _userRoles: Role[],
  ): Promise<TicketResponseDto> {
    const updates: any = {};

    if (changes.type) {
      updates.type = changes.type;
    }
    if (changes.price !== undefined) {
      updates.price = String(changes.price);
    }
    if (changes.userId) {
      updates.user_id = changes.userId;
    }
    if (changes.eventId) {
      updates.event_id = changes.eventId;
    }

    if (Object.keys(updates).length > 0) {
      const [result] = await this.db
        .update(tickets)
        .set(updates)
        .where(eq(tickets.id, id));

      if (result.affectedRows === 0) {
        throw new NotFoundException('No ticket with this id exists');
      }
    }

    return this.getById(id);
  }

  async remove(id: number, _userId: number, _userRoles: Role[]): Promise<void> {
    const [result] = await this.db.delete(tickets).where(eq(tickets.id, id));

    if (result.affectedRows === 0) {
      throw new NotFoundException(
        `Ticket met id ${id} kon niet worden verwijderd`,
      );
    }
  }
  async generateTicketPdf(ticketId: number): Promise<Buffer> {
    // A. Haal ticket op met alle info (User, Event, Location)
    const ticket = await this.db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
      with: {
        user: true,
        event: {
          with: {
            location: true, // We hebben het adres nodig
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket met id ${ticketId} niet gevonden`);
    }

    // B. Maak de PDF in het geheugen
    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // --- PDF OPMAAK ---

      // Header balk
      doc.rect(0, 0, 600, 100).fill('#333333');
      doc.fontSize(30).fillColor('white').text('TOEGANGSTICKET', 50, 35);

      // Ticket ID (rechtsboven)
      doc
        .fontSize(14)
        .text(`Ticket ID: #${ticket.id}`, 400, 45, { align: 'right' });

      // Reset kleur
      doc.fillColor('black').moveDown(4);

      // Event Naam (Groot)
      doc.fontSize(25).font('Helvetica-Bold').text(ticket.event.name, 50, 150);

      // Datum & Tijd
      doc.fontSize(12).font('Helvetica');
      const eventDate = new Date(ticket.event.date).toLocaleDateString(
        'nl-BE',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );
      doc.text(
        `${eventDate} | ${ticket.event.start_time} - ${ticket.event.end_time}`,
      );
      doc.moveDown();

      // Locatie Box
      doc.rect(50, 230, 500, 80).fill('#f0f0f0'); // Grijze achtergrond
      doc.fillColor('black');
      doc.font('Helvetica-Bold').text('LOCATIE', 70, 245);
      doc.font('Helvetica').text(ticket.event.location.name, 70, 265);
      doc.text(
        `${ticket.event.location.street}, ${ticket.event.location.city} (${ticket.event.location.country})`,
      );

      // Bezoeker Info Box
      doc.rect(50, 330, 500, 80).stroke(); // Rand
      doc.font('Helvetica-Bold').text('BEZOEKER', 70, 345);
      doc.font('Helvetica').text(ticket.user.name, 70, 365);
      doc.text(`Type: ${ticket.type} (Prijs: €${ticket.price})`);

      // Footer
      doc
        .fillColor('grey')
        .fontSize(10)
        .text(
          'Dit ticket is geldig voor één persoon. Toon dit document aan de ingang.',
          50,
          700,
          { align: 'center', width: 500 },
        );

      doc.end();
    });

    return pdfBuffer;
  }
}
