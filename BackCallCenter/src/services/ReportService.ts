// src/services/ReportService.ts
import { AppDataSource } from '../config/db';
import { Complaint } from '../models/complaint.entity';
import { Location } from '../models/location.entity';
import { User } from '../models/user.entity';
import { Category } from '../models/category.entity';
import { Between, Repository } from 'typeorm';

interface ReportResult {
  name: string;
  count: number;
  percentage: number;
}

interface ReportData {
  total: number;
  results: ReportResult[];
}

export class ReportService {
  private complaintRepository: Repository<Complaint>;
  private locationRepository: Repository<Location>;
  private userRepository: Repository<User>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.complaintRepository = AppDataSource.getRepository(Complaint);
    this.locationRepository = AppDataSource.getRepository(Location);
    this.userRepository = AppDataSource.getRepository(User);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  private calculatePercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0;
  }

  async getComplaintsByOffice(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('unit.name', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.createdBy', 'user')
      .innerJoin('user.unit', 'unit')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('unit.name')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getComplaintsByCategory(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('category.name', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.category', 'category')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('category.name')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getComplaintsByReceptionist(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('CONCAT(user.names, " ", user.lastname)', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.createdBy', 'user')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('user.id')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getComplaintsBySubMayor(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('location.deputtyMajor', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.location', 'location')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('location.deputtyMajor')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getComplaintsByDistrict(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('location.district', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.location', 'location')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('location.district')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getComplaintsByStatus(year: number): Promise<ReportData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [results, total] = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('complaint.status')
      .getRawMany()
      .then(data => {
        const totalCount = data.reduce((sum, item) => sum + Number(item.count), 0);
        const formattedData = data.map(item => ({
          name: item.name,
          count: Number(item.count),
          percentage: this.calculatePercentage(Number(item.count), totalCount)
        }));
        return [formattedData, totalCount];
      });

    return {
      total,
      results
    };
  }

  async getHeatmap(year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const complaints = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('ST_X(complaint.ubicacion)', 'lng')
      .addSelect('ST_Y(complaint.ubicacion)', 'lat')
      .addSelect('COUNT(complaint.id)', 'weight')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('complaint.ubicacion')
      .getRawMany();

    return complaints.map(c => ({
      lat: Number(c.lat),
      lng: Number(c.lng),
      weight: Number(c.weight)
    }));
  }

  async getEfficiencyStats(year: number): Promise<any> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const qb = this.complaintRepository.createQueryBuilder('complaint')
       .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate });

    const avgResponse = await qb.select('AVG(EXTRACT(EPOCH FROM (complaint.arrivalTime - complaint.registerDate)))', 'avgTime')
       .where('complaint.arrivalTime IS NOT NULL')
       .andWhere('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
       .getRawOne();
       
    const totalAssigned = await this.complaintRepository.count({
      where: { registerDate: Between(startDate, endDate) }
    });
    
    const resolved = await this.complaintRepository.createQueryBuilder('complaint')
      .where('complaint.status = :status', { status: 'Resuelta' })
      .andWhere('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();
      
    const resolutionIndex = totalAssigned > 0 ? (resolved / totalAssigned) * 100 : 0;

    const topCategories = await this.complaintRepository.createQueryBuilder('complaint')
      .select('category.name', 'name')
      .addSelect('COUNT(complaint.id)', 'count')
      .innerJoin('complaint.category', 'category')
      .where('complaint.registerDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('category.id')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      averageResponseTimeSeconds: avgResponse?.avgTime ? Number(avgResponse.avgTime) : 0,
      resolutionIndex: Number(resolutionIndex.toFixed(2)),
      topCategories: topCategories.map(c => ({ name: c.name, count: Number(c.count) }))
    };
  }

  async generateAllReports(year: number) {
    return {
      byOffice: await this.getComplaintsByOffice(year),
      byCategory: await this.getComplaintsByCategory(year),
      byReceptionist: await this.getComplaintsByReceptionist(year),
      bySubMayor: await this.getComplaintsBySubMayor(year),
      byDistrict: await this.getComplaintsByDistrict(year),
      byStatus: await this.getComplaintsByStatus(year)
    };
  }
}

export default new ReportService();