import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGammeOperationDto {
  @IsOptional()
  @IsInt()
  ordre?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  libelle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  tempsStandard?: number;

  @IsOptional()
  @IsBoolean()
  obligatoire?: boolean;

  @IsOptional()
  @IsInt()
  idPointStructure?: number;

  @IsOptional()
  @IsInt()
  idMateriel?: number;

  @IsOptional()
  @IsInt()
  idModele?: number;

}