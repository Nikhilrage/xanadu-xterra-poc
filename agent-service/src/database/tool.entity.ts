import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tools')
export class Tool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  category!: string;

  @Column({ default: 'ACTIVE' })
  status!: 'ACTIVE' | 'INACTIVE';

  @CreateDateColumn()
  createdAt!: Date;
}
