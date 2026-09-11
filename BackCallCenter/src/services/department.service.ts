import { AppDataSource } from '../config/db';
import { Department } from '../models/department.entity';
import { Unit } from '../models/unit.entity';
import { Category } from '../models/category.entity';
import { In, Repository } from 'typeorm';

export class DepartmentService {
  private repo: Repository<Department> = AppDataSource.getRepository(Department);
  private unitRepo: Repository<Unit> = AppDataSource.getRepository(Unit);
  private categoryRepo: Repository<Category> = AppDataSource.getRepository(Category);

  async findAll(): Promise<Department[]> {
    return this.repo.find({
      where: { status: 1 },
      relations: ['units'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Department | null> {
    return this.repo.findOne({ where: { id }, relations: ['units'] });
  }

  async create(dto: Partial<Department>, userId: number): Promise<Department> {
    const dept = this.repo.create({ ...dto, userId, status: 1 });
    return this.repo.save(dept);
  }

  async update(id: number, dto: Partial<Department>): Promise<Department | null> {
    const dept = await this.repo.findOneBy({ id });
    if (!dept) return null;
    Object.assign(dept, dto);
    return this.repo.save(dept);
  }

  async remove(id: number): Promise<boolean> {
    const dept = await this.repo.findOneBy({ id });
    if (!dept) return false;
    dept.status = 0;
    await this.repo.save(dept);

    // Obtener IDs de las unidades del departamento para cascada a categorías
    const units = await this.unitRepo.findBy({ departmentId: id });
    const unitIds = units.map((u) => u.id);

    await this.unitRepo.update({ departmentId: id }, { status: 0 });

    // Cascada a categorías y subcategorías de esas unidades
    if (unitIds.length > 0) {
      await this.categoryRepo.update({ unitId: In(unitIds) }, { status: 0 });
    }

    return true;
  }
}
