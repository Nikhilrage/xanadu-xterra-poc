import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AgentExecution } from './agent-execution.entity';

@Entity('execution_tool_calls')
export class ExecutionToolCall {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  executionId!: string;

  @ManyToOne(() => AgentExecution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'executionId' })
  execution!: AgentExecution;

  @Column()
  toolKey!: string;

  @Column('jsonb')
  requestPayload!: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  responsePayload!: Record<string, unknown> | null;

  @Column()
  authorized!: boolean;

  @Column('text', { nullable: true })
  error!: string | null;

  @Column('integer')
  durationMs!: number;

  @CreateDateColumn()
  calledAt!: Date;
}
