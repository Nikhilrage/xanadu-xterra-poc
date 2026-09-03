import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    default: 'developer',
  })
  type!: 'developer' | 'cp';

  @Column('uuid', {
    nullable: true,
  })
  adminId!: string | null;

  // Kept temporarily so organisations created by the earlier POC flow still load.
  @Column('uuid', {
    nullable: true,
  })
  developerId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
