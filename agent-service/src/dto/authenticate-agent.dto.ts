import { IsNotEmpty, IsString } from 'class-validator';

export class AuthenticateAgentDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}
