import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'Location' })
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, default: 'Sin información' })
  deputtyMajor!: string;

  @Column({ length: 255, default: 'Distrito no especificado' })
  district!: string;

}
