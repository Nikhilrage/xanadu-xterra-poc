import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class RegisterAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsUUID()
  @IsOptional()
  ownerOrganizationId?: string;

  @IsIn(['AUTOMATIC', 'MANUAL'])
  executionMode!: 'AUTOMATIC' | 'MANUAL';

  @ValidateIf(
    (dto: RegisterAgentDto) =>
      dto.executionMode === 'AUTOMATIC' || dto.eventIds !== undefined,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  eventIds?: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  toolIds!: string[];
}
