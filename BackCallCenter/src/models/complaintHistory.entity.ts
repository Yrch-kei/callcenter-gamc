import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Complaint } from './complaint.entity';
import { User } from './user.entity';

@Entity({ name: 'ComplaintHistory' })
export class ComplaintHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  complaintId!: number;

  @ManyToOne(() => Complaint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaintId' })
  complaint!: Complaint;

  @Column({ length: 300 })
  description!: string;

  @Column({
    type: 'enum',
    enum: ['creacion', 'asignacion', 'cambio_estado', 'nota', 'derivacion', 'edicion', 'intervencion'],
    default: 'cambio_estado',
  })
  tipo!: string;

  @Column({ type: 'smallint', default: 1 })
  status!: number;

  @CreateDateColumn({ type: 'timestamp' })
  registerDate!: Date;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
