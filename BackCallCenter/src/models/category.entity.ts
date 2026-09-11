import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Unit } from './unit.entity';

/** Nivel 3 de la jerarquía: Categoría.
 *  Si parentCategoryId es null → es una Categoría.
 *  Si parentCategoryId tiene valor → es una Subcategoría (Nivel 4).
 */
@Entity({ name: 'Category' })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 55 })
  name!: string;

  @Column({ default: 1 })
  status!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerDate!: Date;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  unitId?: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unitId' })
  unit!: Unit;

  /** FK auto-referencial: si tiene valor, este registro ES una Subcategoría */
  @Column({ nullable: true })
  parentCategoryId?: number;

  @ManyToOne(() => Category, (cat: Category) => cat.subcategories, { nullable: true })
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory?: Category;

  @OneToMany(() => Category, (cat: Category) => cat.parentCategory)
  subcategories?: Category[];
}

