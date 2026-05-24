import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

import {
  CriticitePointStructure,
  EtatPointStructure,
  TypePointStructure,
} from '../enums/point-structure.enum';

function trimString({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class FindPointStructureQueryDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TypePointStructure)
  typePoint?: TypePointStructure;

  @IsOptional()
  @IsIn(['true', 'false', 'all'])
  actif?: 'true' | 'false' | 'all';

  @IsOptional()
  @IsEnum(EtatPointStructure)
  etat?: EtatPointStructure;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsEnum(CriticitePointStructure)
  criticite?: CriticitePointStructure;
}