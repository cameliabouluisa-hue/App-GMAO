import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDemandeInterventionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsDateString()
  dateDemande?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  idMateriel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  priorite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  criticite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  demandeur?: string;

  @IsOptional()
  @IsBoolean()
  receptionTravaux?: boolean;

  @IsOptional()
  @IsBoolean()
  materielEnPanne?: boolean;

  @IsOptional()
  @IsBoolean()
  materielIndisponible?: boolean;
}