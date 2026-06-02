import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const TYPE_FAMILLE_VALUES = ['EQUIPEMENT', 'ARTICLE', 'MIXTE'] as const;

export type TypeFamilleValue = (typeof TYPE_FAMILLE_VALUES)[number];

export const NATURE_ACHAT_FAMILLE_VALUES = [
  'ELECTRIQUE',
  'MECANIQUE',
  'HYDRAULIQUE',
  'PNEUMATIQUE',
  'AUTOMATISME',
  'INFORMATIQUE',
  'GENERAL',
] as const;

export type NatureAchatFamilleValue =
  (typeof NATURE_ACHAT_FAMILLE_VALUES)[number];

export class CreateFamilleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  libelle?: string;

  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsIn(TYPE_FAMILLE_VALUES)
  typeFamille?: TypeFamilleValue;

  @IsOptional()
  @IsIn(NATURE_ACHAT_FAMILLE_VALUES)
  natureAchat?: NatureAchatFamilleValue | null;
}