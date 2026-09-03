import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  location!: string;

  @Column('varchar', {
    nullable: true,
  })
  reraNumber!: string | null;

  @Column('jsonb', {
    nullable: true,
  })
  priceRange!: string[] | null;

  @Column('text', {
    nullable: true,
  })
  description!: string | null;

  @Column('uuid')
  organizationId!: string;

  @Column('uuid')
  creatorId!: string;

  @Column()
  creatorRole!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
