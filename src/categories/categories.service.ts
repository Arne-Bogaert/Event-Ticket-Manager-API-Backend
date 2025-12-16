import { Injectable, NotFoundException } from '@nestjs/common';
import * as drizzleProvider from '../drizzle/drizzle.provider';
import { categories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import {
  CategoryListResponseDto,
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @drizzleProvider.InjectDrizzle()
    private readonly db: drizzleProvider.DatabaseProvider,
  ) {}

  async findAll(): Promise<CategoryListResponseDto> {
    const rows = await this.db.query.categories.findMany();

    return {
      items: plainToInstance(CategoryResponseDto, rows, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new NotFoundException(`Category met id ${id} niet gevonden`);
    }

    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const [result] = await this.db
      .insert(categories)
      .values({ name: dto.name })
      .$returningId();

    return this.findOne(result.id);
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (dto.name) {
      const [result] = await this.db
        .update(categories)
        .set({ name: dto.name })
        .where(eq(categories.id, id));

      if (result.affectedRows === 0) {
        throw new NotFoundException(`Category met id ${id} niet gevonden`);
      }
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Door 'onDelete: cascade' in je schema worden regels in de
    // tussentabel (EventCategories) automatisch verwijderd door de database.
    const [result] = await this.db
      .delete(categories)
      .where(eq(categories.id, id));

    if (result.affectedRows === 0) {
      throw new NotFoundException(`Category met id ${id} niet gevonden`);
    }
  }
}
