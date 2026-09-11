import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Unit } from './unit.entity';

@Entity({ name: 'User' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  names!: string;

  @Column({ length: 70 })
  lastname!: string;

  @Column({ length: 70, nullable: true })
  secondLastname?: string;

  @Column({ length: 13, unique: true })
  ci!: string;

  @Column({ length: 13 })
  phone!: string;

  @Column({ type: 'date' })
  birthdate!: Date;

  @Column()
  gender!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ default: 1 })
  status!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  updateDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleteDate?: Date;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  roleId!: number;

  @ManyToOne(() => Role, { createForeignKeyConstraints: true })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @Column({ nullable: true })
  unitId!: number | null;

  @ManyToOne(() => Unit, { nullable: true, createForeignKeyConstraints: true })
  @JoinColumn({ name: 'unitId' })
  unit!: Unit | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires!: Date | null;
}