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
import { Event } from './event.entity';

@Entity('agent_events')
@Unique(['agentId', 'eventId'])
export class AgentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  agentId!: string;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent!: Agent;

  @Column('uuid')
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @CreateDateColumn()
  createdAt!: Date;
}
