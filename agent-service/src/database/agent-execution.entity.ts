import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

@Entity('agent_executions')
export class AgentExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  runCode!: string;

  @Column('uuid')
  agentId!: string;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent!: Agent;

  @Column({ default: 'EVENT' })
  triggerSource!: 'EVENT' | 'MANUAL';

  @Column('varchar', { nullable: true })
  triggerEventKey!: string | null;

  @Column('jsonb')
  eventPayload!: Record<string, unknown>;

  @Column({ default: 'PENDING' })
  status!: ExecutionStatus;

  @Column('jsonb', { nullable: true })
  result!: Record<string, unknown> | null;

  @Column('text', { nullable: true })
  error!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
