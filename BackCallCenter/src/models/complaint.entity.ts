import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { Mandated } from './mandated.entity';
import { Company } from './company.entity';
import { Location } from './location.entity';
import { User } from './user.entity';
import { ComplaintImage } from './complaintImage.entity';

@Entity({ name: 'Complaint' })
export class Complaint {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false
  })
  ubicacion!: string;

  @Column({ length: 100, default: 'Anónimo' })
  names!: string;

  @Column({ length: 160, default: '' })
  lastname!: string;

  @Column({ length: 13, default: '0000000' })
  phone!: string;

  @Column({ length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'Sin título' })
  title!: string;

  @Column({ type: 'text', default: 'Incidente no especificado' })
  incident!: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0 })
  longitude!: number;

  @Column({ length: 255, default: 'Dirección no especificada' })
  address!: string;

  @Column({ default: 1 })
  risk!: number;

  @Column({ default: 1 })
  amount!: number;

  @Column({ length: 255, default: '' })
  evidence!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  citizenEmail!: string | null;

  @Column({ type: 'boolean', default: false })
  notifyEmail!: boolean;

  @Column({ type: 'smallint', nullable: true })
  satisfactionRating!: number | null;

  @Column({ type: 'text', nullable: true })
  reopenReason!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'NONE' })
  reopenStatus!: string;

  @Column({ type: 'text', nullable: true })
  reopenResolution!: string | null;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Derivada', 'En proceso', 'Resuelta', 'Cancelada'],
    default: 'Pendiente'
  })
  status!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  updateDate?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'editBy' })
  editBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'attendedById' })
  attendedBy?: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ManyToOne(() => Mandated, { nullable: true })
  @JoinColumn({ name: 'mandatedId' })
  mandated?: Mandated;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ type: 'timestamp', nullable: true })
  arrivalTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishTime?: Date;

  @Column({ type: 'text', nullable: true })
  technicalNotes?: string;

  @Column({ type: 'text', nullable: true })
  materialsUsed?: string;

  @Column({ type: 'text', nullable: true })
  operatorSignature?: string;

  @Column({
    type: 'enum',
    enum: ['Resuelto', 'Parcial', 'No Resuelto'],
    nullable: true
  })
  resolutionResult?: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true
  })
  arrivalLocation?: string;

  @OneToMany(() => ComplaintImage, (image: ComplaintImage) => image.complaint, { cascade: true })
  images?: ComplaintImage[];
}
