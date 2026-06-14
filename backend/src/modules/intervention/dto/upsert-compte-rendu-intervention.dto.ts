import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertCompteRenduInterventionDto {
  @IsOptional()
  @IsDateString()
  dateCompteRendu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  saisiPar?: string;

  @IsOptional()
  @IsString()
  travauxEffectues?: string;

  @IsOptional()
  @IsString()
  diagnostic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  cause?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  remede?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  resultat?: string; // REPARE, NON_REPARE, PARTIEL

  @IsOptional()
  @IsNumber()
  tempsArret?: number;

  @IsOptional()
  @IsNumber()
  dureeReelle?: number;
}