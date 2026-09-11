import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from './department.entity';

/** Nivel 2 de la jerarquía: Sub-área operativa */
@Entity({ name: 'Unit' })
export class Unit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 600 })
  description!: string;

  @Column({ default: 1 })
  status!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  departmentId?: number;

  @ManyToOne(() => Department, (dept: Department) => dept.units, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;
}
