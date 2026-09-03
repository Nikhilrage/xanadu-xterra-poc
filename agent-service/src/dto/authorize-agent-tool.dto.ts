import { IsNotEmpty, IsString } from 'class-validator';
import { AuthenticateAgentDto } from './authenticate-agent.dto';

export class AuthorizeAgentToolDto extends AuthenticateAgentDto {
  @IsString()
  @IsNotEmpty()
  toolKey!: string;
}
