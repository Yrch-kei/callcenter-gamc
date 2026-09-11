import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Complaint } from './complaint.entity';

export enum AssignmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REASSIGNED = 'reassigned',
  CANCELLED = 'cancelled'
}

@Entity({ name: 'UserComplaint' })
@Index(['user', 'complaint', 'status'], { unique: true, where: 'status = "active"' })
export class UserComplaint {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Complaint, { eager: true })
  @JoinColumn({ name: 'complaintId' })
  complaint!: Complaint;

  @Column({ 
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE
  })
  status!: AssignmentStatus;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  startDate!: Date;

  @Column({ 
    type: 'timestamp', 
    nullable: true 
  })
  endDate?: Date;

  @Column({ 
    type: 'text', 
    nullable: true 
  })
  cancellationReason?: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedById' })
  assignedBy!: User; // Quién realizó la asignación

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  createdAt!: Date;

  @Column({ 
    type: 'timestamp', 
    onUpdate: 'CURRENT_TIMESTAMP', 
    nullable: true 
  })
  updatedAt?: Date;
}