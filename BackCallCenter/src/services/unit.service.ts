import { AppDataSource } from '../config/db';
import { Unit } from '../models/unit.entity';
import { Category } from '../models/category.entity';
import { Repository } from 'typeorm';
import { eliminateSpaces } from '../validations/user.validation';

export class UnitService {
  private unitRepository: Repository<Unit> = AppDataSource.getRepository(Unit);
  private categoryRepository: Repository<Category> = AppDataSource.getRepository(Category);

  private async validateAndPrepareUnitData(data: Partial<Unit>, userId: number) {
    data.userId = userId;
    data.name = eliminateSpaces(data.name);
    data.description = eliminateSpaces(data.description);
  }

  async create(data: Partial<Unit>, userId: number): Promise<Unit> {
    await this.validateAndPrepareUnitData(data, userId);
    const unit = this.unitRepository.create(data);
    return await this.unitRepository.save(unit);
  }

  async findAll(): Promise<Unit[]> {
    return await this.unitRepository.find({
      where: { status: 1 },
      relations: ['department'],
    });
  }

  async findOne(id: number): Promise<Unit | null> {
    return await this.unitRepository.findOne({
      where: { id, status: 1 },
      relations: ['department'],
    });
  }

  async update(id: number, data: Partial<Unit>, userId: number): Promise<Unit | null> {
    await this.validateAndPrepareUnitData(data, userId);
    await this.unitRepository.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: number, userEliminateId: number): Promise<void> {
    await this.unitRepository.update(id, { status: 0, userId: userEliminateId });

    // Soft-delete associated categories
    await this.categoryRepository.update(
      { unit: { id } },
      { status: 0, userId: userEliminateId }
    );
  }
}
