import { AppDataSource } from '../config/db';
import { Category } from '../models/category.entity';
import { Repository, IsNull } from 'typeorm';

export class CategoryService {
  private categoryRepository: Repository<Category> = AppDataSource.getRepository(Category);

  async create(data: Partial<Category>, userId: number): Promise<Category> {
    const category = this.categoryRepository.create(data);
    category.userId = userId;
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    // Return top-level categories (no parent) with their unit and subcategories
    return await this.categoryRepository.find({
      where: { status: 1, parentCategoryId: IsNull() },
      relations: ['unit', 'subcategories'],
      order: { name: 'ASC' },
    });
  }

  async findAllFlat(): Promise<Category[]> {
    // Return all categories flat (for backward compat)
    return await this.categoryRepository.find({
      where: { status: 1 },
      relations: ['unit'],
      order: { name: 'ASC' },
    });
  }

  async findByUnit(unitId: number): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { status: 1, unit: { id: unitId }, parentCategoryId: IsNull() },
      relations: ['subcategories'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id, status: 1 },
      relations: ['unit', 'subcategories'],
    });
  }

  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: number, userId: number): Promise<void> {
    // Also soft-delete subcategories
    await this.categoryRepository.update(
      { parentCategoryId: id },
      { status: 0, userId }
    );
    await this.categoryRepository.update(id, { status: 0, userId });
  }
}
