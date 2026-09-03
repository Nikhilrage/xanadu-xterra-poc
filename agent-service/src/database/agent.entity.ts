import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  agentId!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  type!: string;

  @Column('uuid', { nullable: true })
  ownerOrganizationId!: string | null;

  @Column({ default: 'AUTOMATIC' })
  executionMode!: 'AUTOMATIC' | 'MANUAL';

  @Column('varchar', { nullable: true })
  runtimeUrl!: string | null;

  @Column({ default: 'ACTIVE' })
  status!: 'ACTIVE' | 'DISABLED';

  @Column()
  apiKeyPrefix!: string;

  @Column()
  apiKeyHash!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
