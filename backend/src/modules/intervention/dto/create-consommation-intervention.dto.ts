import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateConsommationInterventionDto {
  @Type(() => Number)
  @IsInt()
  idArticle: number;

  @Type(() => Number)
  @IsInt()
  idMagasin: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantite: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}