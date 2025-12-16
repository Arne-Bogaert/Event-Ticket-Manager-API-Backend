import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import * as drizzleProvider from '../drizzle/drizzle.provider';
import { events, eventCategories } from '../drizzle/schema';
import {
  CreateEventRequestDto,
  EventListResponseDto,
  EventResponseDto,
  UpdateEventRequestDto,
} from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    @drizzleProvider.InjectDrizzle()
    private readonly db: drizzleProvider.DatabaseProvider,
  ) {}

  async getById(id: number): Promise<EventResponseDto> {
    const event = await this.db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        location: true,

        eventCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event met id ${id} niet gevonden`);
    }

    const mappedEvent = {
      ...event,
      categories: event.eventCategories.map((link) => link.category),
    };

    return plainToInstance(EventResponseDto, mappedEvent, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(): Promise<EventListResponseDto> {
    const rows = await this.db.query.events.findMany({
      with: {
        location: true,

        eventCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    const items = rows.map((row) => ({
      ...row,
      categories: row.eventCategories.map((link) => link.category),
    }));

    return {
      items: plainToInstance(EventResponseDto, items, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findOne(id: number): Promise<EventResponseDto> {
    return this.getById(id);
  }

  async create(dto: CreateEventRequestDto): Promise<EventResponseDto> {
    const [result] = await this.db
      .insert(events)
      .values({
        name: dto.name,
        date: new Date(dto.date),
        start_time: dto.startTime,
        end_time: dto.endTime,
        location_id: dto.locationId,
      })
      .$returningId();

    const newEventId = result.id;

    if (dto.categoryIds && dto.categoryIds.length > 0) {
      await this.db.insert(eventCategories).values(
        dto.categoryIds.map((catId) => ({
          event_id: newEventId,
          category_id: catId,
        })),
      );
    }

    return this.getById(newEventId);
  }

  async update(
    id: number,
    dto: UpdateEventRequestDto,
  ): Promise<EventResponseDto> {
    const updates: any = { ...dto };
    if (dto.date) updates.date = new Date(dto.date);
    if (dto.startTime) updates.start_time = dto.startTime;
    if (dto.endTime) updates.end_time = dto.endTime;
    if (dto.locationId) updates.location_id = dto.locationId;

    delete updates.categoryIds;
    delete updates.startTime;
    delete updates.endTime;
    delete updates.locationId;

    if (Object.keys(updates).length > 0) {
      const [result] = await this.db
        .update(events)
        .set(updates)
        .where(eq(events.id, id));

      if (result.affectedRows === 0) {
        throw new NotFoundException(`Event met id ${id} niet gevonden`);
      }
    }

    if (dto.categoryIds) {
      await this.db
        .delete(eventCategories)
        .where(eq(eventCategories.event_id, id));

      if (dto.categoryIds.length > 0) {
        await this.db.insert(eventCategories).values(
          dto.categoryIds.map((catId) => ({
            event_id: id,
            category_id: catId,
          })),
        );
      }
    }

    return this.getById(id);
  }

  async remove(id: number): Promise<void> {
    const [result] = await this.db.delete(events).where(eq(events.id, id));

    if (result.affectedRows === 0) {
      throw new NotFoundException(
        `Event met id ${id} kon niet worden verwijderd`,
      );
    }
  }
}
