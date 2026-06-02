import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  NATURE_ACHAT_FAMILLE_VALUES,
  NatureAchatFamilleValue,
  TYPE_FAMILLE_VALUES,
  TypeFamilleValue,
} from './create-famille.dto';

export class UpdateFamilleDto {
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