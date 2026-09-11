import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Unit } from './unit.entity';

/** Nivel 1 de la jerarquía operativa: Departamento / Área principal */
@Entity({ name: 'Department' })
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 500, default: '' })
  description!: string;

  @Column({ default: 1 })
  status!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column()
  userId!: number;

  @OneToMany(() => Unit, (unit: Unit) => unit.department)
  units?: Unit[];
}
