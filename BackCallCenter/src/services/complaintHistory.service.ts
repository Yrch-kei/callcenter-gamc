import { Repository } from 'typeorm';
import { AppDataSource } from '../config/db';
import { ComplaintHistory } from '../models/complaintHistory.entity';
import { Complaint } from '../models/complaint.entity';
import { User } from '../models/user.entity';
import { CreateComplaintHistoryDto } from '../dtos/ComplaintHistory/createComplaintHistory.dto';
import { UpdateComplaintHistoryDto } from '../dtos/ComplaintHistory/updateComplaintHistory.dto';

export class ComplaintHistoryService {
  private repo: Repository<ComplaintHistory> = AppDataSource.getRepository(ComplaintHistory);
  private complaintRepo = AppDataSource.getRepository(Complaint);
  private userRepo      = AppDataSource.getRepository(User);

  async create(dto: CreateComplaintHistoryDto): Promise<ComplaintHistory> {
    // validar existencia de complaint y usuario
    const complaint = await this.complaintRepo.findOneByOrFail({ id: dto.complaintId });
    const user      = await this.userRepo.findOneByOrFail({ id: dto.userId });

    const entry = this.repo.create({
      complaint,
      description: dto.description,
      tipo: dto.tipo ?? 'cambio_estado',
      user,
    });

    return this.repo.save(entry);
  }

  async findAll(): Promise<ComplaintHistory[]> {
    return this.repo.find({
      relations: ['complaint', 'user'],
      order: { registerDate: 'DESC' },
    });
  }

  async findByComplaint(complaintId: number): Promise<ComplaintHistory[]> {
    return this.repo.find({
      where: { complaint: { id: complaintId } },
      relations: ['user'],
      order: { registerDate: 'DESC' },
    });
  }

  async update(
    id: number,
    dto: UpdateComplaintHistoryDto
  ): Promise<ComplaintHistory | null> {
    const entry = await this.repo.findOneBy({ id });
    if (!entry) return null;

    if (dto.description !== undefined) entry.description = dto.description;
    if (dto.status      !== undefined) entry.status      = dto.status;

    return this.repo.save(entry);
  }
}
