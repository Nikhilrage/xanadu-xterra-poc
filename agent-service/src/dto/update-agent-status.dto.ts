import { IsIn } from 'class-validator';

export class UpdateAgentStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status!: 'ACTIVE' | 'DISABLED';
}
