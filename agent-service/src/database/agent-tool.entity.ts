import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Agent } from './agent.entity';
import { Tool } from './tool.entity';

@Entity('agent_tools')
@Unique(['agentId', 'toolId'])
export class AgentTool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  agentId!: string;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent!: Agent;

  @Column('uuid')
  toolId!: string;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toolId' })
  tool!: Tool;

  @CreateDateColumn()
  grantedAt!: Date;
}
