import { Repository } from 'typeorm';
import { AppDataSource } from '../config/db';
import { UserComplaint } from '../models/userComplaint.entity';
import { AssignmentStatus } from '../models/userComplaint.entity';
import { Complaint } from '../models/complaint.entity';
import { User } from '../models/user.entity';
import { ComplaintHistory } from '../models/complaintHistory.entity';

export class UserComplaintService {
  private userComplaintRepository = AppDataSource.getRepository(UserComplaint);
  private complaintRepository = AppDataSource.getRepository(Complaint);
  private userRepository = AppDataSource.getRepository(User);
  private complaintHistoryRepository = AppDataSource.getRepository(ComplaintHistory);

  // Asignar denuncia a un usuario
  async assignComplaint(complaintId: number, userId: number, assignedById: number): Promise<UserComplaint> {
    // Verificar si la denuncia existe
    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new Error('Denuncia no encontrada');
    }

    // Verificar si el usuario asignado existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si ya tiene una asignación activa
    const existingAssignment = await this.userComplaintRepository.findOne({
      where: {
        complaint: { id: complaintId },
        status: AssignmentStatus.ACTIVE
      }
    });

    if (existingAssignment) {
      throw new Error('Esta denuncia ya está asignada a otro usuario');
    }

    complaint.status = "Derivada";
    complaint.updateDate = new Date();
    await this.complaintRepository.save(complaint);

    // Crear la nueva asignación
    const newAssignment = this.userComplaintRepository.create({
      complaint: { id: complaintId },
      user: { id: userId },
      status: AssignmentStatus.ACTIVE,
      assignedBy: { id: assignedById }
    });

    const savedAssignment = await this.userComplaintRepository.save(newAssignment);

    // Insertar un nuevo registro en el historial de la denuncia
    const newHistory = this.complaintHistoryRepository.create({
      complaint: { id: complaintId },
      description: `La denuncia fue derivada a ${user.names}`,
    });
    await this.complaintHistoryRepository.save(newHistory);

    return savedAssignment;
  }

  // Cancelar asignación
  async cancelAssignment(
    assignmentId: number, 
    cancelledById: number, 
    reason?: string
  ): Promise<UserComplaint> {
    const assignment = await this.userComplaintRepository.findOne({
      where: { id: assignmentId },
      relations: ['complaint', 'user']
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new Error('Solo se pueden cancelar asignaciones activas');
    }

    assignment.status = AssignmentStatus.CANCELLED;
    assignment.endDate = new Date();
    assignment.cancellationReason = reason;
    assignment.updatedAt = new Date();

    return await this.userComplaintRepository.save(assignment);
  }

  // Completar asignación
  async completeAssignment(
    assignmentId: number, 
    completedById: number, 
    notes?: string
  ): Promise<UserComplaint> {
    const assignment = await this.userComplaintRepository.findOne({
      where: { id: assignmentId },
      relations: ['complaint', 'user']
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new Error('Solo se pueden completar asignaciones activas');
    }

    assignment.status = AssignmentStatus.COMPLETED;
    assignment.endDate = new Date();
    assignment.cancellationReason = notes; // Reutilizando el campo para notas de cierre
    assignment.updatedAt = new Date();

    const savedAssignment = await this.userComplaintRepository.save(assignment);

    const complaint = assignment.complaint;
    complaint.status = "Resuelta"; 
    complaint.updateDate = new Date();
    await this.complaintRepository.save(complaint);


    const completingUser = await this.userRepository.findOne({ where: { id: completedById } });

    const historyMessage = completingUser 
      ? `La denuncia fue resuelta por ${completingUser.names}${notes ? ' - ' + notes : ''}`
      : `La denuncia fue resuelta${notes ? ' - ' + notes : ''}`;

    const newHistory = this.complaintHistoryRepository.create({
      complaint: { id: complaint.id },
      description: historyMessage,
    });
    await this.complaintHistoryRepository.save(newHistory);

    return savedAssignment;
  }

  // Obtener asignaciones por usuario
  async getAssignmentsByUser(userId: number, status?: AssignmentStatus): Promise<UserComplaint[]> {
    const where: any = { user: { id: userId } };
    if (status) {
      where.status = status;
    }

    return await this.userComplaintRepository.find({
      where,
      relations: ['complaint', 'assignedBy']
    });
  }

  // Obtener asignaciones por denuncia
  async getAssignmentsByComplaint(complaintId: number): Promise<UserComplaint[]> {
    return await this.userComplaintRepository.find({
      where: { complaint: { id: complaintId } },
      relations: ['user', 'assignedBy'],
      order: { startDate: 'DESC' }
    });
  }
}