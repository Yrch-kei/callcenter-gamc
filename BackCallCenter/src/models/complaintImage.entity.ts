import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity({ name: 'ComplaintImage' })
export class ComplaintImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  url!: string;

  @Column({
    type: 'enum',
    enum: ['BEFORE', 'AFTER']
  })
  type!: string;

  @ManyToOne(() => Complaint, complaint => complaint.images)
  @JoinColumn({ name: 'complaintId' })
  complaint!: Complaint;
}
