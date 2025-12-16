// src/locations/locations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as drizzleProvider from '../drizzle/drizzle.provider';
import { locations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import {
  CreateLocationDto,
  LocationListResponseDto,
  LocationResponseDto,
  UpdateLocationDto,
} from './dto/locations.dto';

@Injectable()
export class LocationsService {
  constructor(
    @drizzleProvider.InjectDrizzle()
    private readonly db: drizzleProvider.DatabaseProvider,
  ) {}

  async findAll(): Promise<LocationListResponseDto> {
    const rows = await this.db.select().from(locations);

    return {
      items: plainToInstance(LocationResponseDto, rows, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findOne(id: number): Promise<LocationResponseDto> {
    const [location] = await this.db
      .select()
      .from(locations)
      .where(eq(locations.id, id));

    if (!location) {
      throw new NotFoundException(`Location met id ${id} niet gevonden`);
    }

    return plainToInstance(LocationResponseDto, location, {
      excludeExtraneousValues: true,
    });
  }

  async create(dto: CreateLocationDto): Promise<LocationResponseDto> {
    const [result] = await this.db
      .insert(locations)
      .values({
        name: dto.name,
        street: dto.street,
        city: dto.city,
        postal_code: dto.postalCode, // Mapping
        country: dto.country,
      })
      .$returningId();

    return this.findOne(result.id);
  }

  async update(
    id: number,
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const updates: any = {};

    if (dto.name) updates.name = dto.name;
    if (dto.street) updates.street = dto.street;
    if (dto.city) updates.city = dto.city;
    if (dto.postalCode) updates.postal_code = dto.postalCode; // Mapping
    if (dto.country) updates.country = dto.country;

    if (Object.keys(updates).length > 0) {
      const [result] = await this.db
        .update(locations)
        .set(updates)
        .where(eq(locations.id, id));

      if (result.affectedRows === 0) {
        throw new NotFoundException(`Location met id ${id} niet gevonden`);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Let op: Dit faalt als er nog Events aan deze locatie hangen (Foreign Key)
    // De Global Exception filter vangt dit op en geeft een duidelijke error.
    const [result] = await this.db
      .delete(locations)
      .where(eq(locations.id, id));

    if (result.affectedRows === 0) {
      throw new NotFoundException(
        `Location met id ${id} kon niet verwijderd worden`,
      );
    }
  }
}
