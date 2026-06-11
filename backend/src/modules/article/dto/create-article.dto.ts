import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CategorieArticle } from '../../../../generated/prisma/client';

export class StockInitialMaterielDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroSerie?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  libelle?: string;
}

export class StockInitialDto {
  @Type(() => Number)
  @IsInt()
  idMagasin!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantite!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroLot?: string;

  @IsOptional()
  @IsDateString()
  datePeremption?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockInitialMaterielDto)
  materiels?: StockInitialMaterielDto[];
}

export class CreateArticleDto {
  @IsString()
  @MaxLength(50)
  reference!: string;

  @IsString()
  @MaxLength(150)
  designation!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  etatArticle?: string;

  @IsOptional()
  @IsEnum(CategorieArticle)
  categorie?: CategorieArticle;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idFamille?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idUniteArticle?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fournisseurPrincipal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fabricantArticle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceFabricant?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  nbDecimales?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  codeBarres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  centreCout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  codeComptable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  natureAchat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxe?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prixStandard?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prixMoyenPondere?: number;

  @IsOptional()
  @IsBoolean()
  estModele?: boolean;

  @IsOptional()
  @IsBoolean()
  gereEnStock?: boolean;

  @IsOptional()
  @IsBoolean()
  gereParLot?: boolean;

  @IsOptional()
  @IsBoolean()
  serialise?: boolean;

  @IsOptional()
  @IsBoolean()
  reparable?: boolean;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StockInitialDto)
  stockInitial?: StockInitialDto;
}