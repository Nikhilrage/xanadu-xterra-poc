import { IsObject, IsOptional, IsString } from 'class-validator';

export class RunAgentDto {
  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
