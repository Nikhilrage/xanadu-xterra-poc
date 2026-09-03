import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { Tool } from './tool.entity';

@Entity('event_tools')
@Unique(['eventId', 'toolId'])
export class EventTool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  eventId!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column('uuid')
  toolId!: string;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toolId' })
  tool!: Tool;

  @CreateDateColumn()
  createdAt!: Date;
}
