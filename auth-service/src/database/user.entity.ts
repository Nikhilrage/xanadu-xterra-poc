import { UserRole } from 'src/constant';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column()
  role!: UserRole;

  @Column()
  password!: string;
}
