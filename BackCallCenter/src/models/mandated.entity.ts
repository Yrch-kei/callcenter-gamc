import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'Mandated' })
export class Mandated {
  @PrimaryColumn()
  id!: number;

  @Column({ length: 150, default: 'General' })
  speciality!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id' })
  user!: User;
}
