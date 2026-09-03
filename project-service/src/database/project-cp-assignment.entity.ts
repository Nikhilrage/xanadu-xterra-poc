import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('project_cp_assignments')
@Unique(['projectId', 'cpOrganizationId'])
export class ProjectCpAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  projectId!: string;

  @Column('uuid')
  cpOrganizationId!: string;

  @Column('uuid')
  assignedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
