import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'Role' })
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 40, default: 'Usuario' })
  name!: string;
}