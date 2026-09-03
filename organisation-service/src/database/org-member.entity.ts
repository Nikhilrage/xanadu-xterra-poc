import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('organization_members')
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column('uuid')
  userId!: string;

  @Column()
  role!: 'developer_member' | 'cp_member';

  @CreateDateColumn()
  createdAt!: Date;
}
