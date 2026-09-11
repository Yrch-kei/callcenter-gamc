import { AppDataSource } from '../config/db';
import { Company } from '../models/company.entity';
import { Repository } from 'typeorm';
import { eliminateSpaces } from '../validations/user.validation';


export class CompanyService {
  private companyRepository: Repository<Company> = AppDataSource.getRepository(Company);

  private async validateAndPrepareCompanyData(data: Partial<Company>, userId: number) {
      data.userId = userId;
      data.name = eliminateSpaces(data.name);
  }

  async create(data: Partial<Company>, userId: number): Promise<Company> {
    await this.validateAndPrepareCompanyData(data, userId);
    const company = this.companyRepository.create(data);
    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({ where: { status: 1 } });
  }

  async findOne(id: number): Promise<Company | null> {
    return await this.companyRepository.findOne({ where: { id, status: 1 } });
  }

  async update(id: number, data: Partial<Company>, userId: number): Promise<Company | null> {
    await this.validateAndPrepareCompanyData(data, userId);
    await this.companyRepository.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.companyRepository.update(id, { status: 0, userId: userId });
  }
}