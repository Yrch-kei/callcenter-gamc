import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'Company' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150, default: 'Empresa Sin Nombre' })
  name!: string;

  @Column({ default: 1 })
  status!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column()
  userId!: number;
}
