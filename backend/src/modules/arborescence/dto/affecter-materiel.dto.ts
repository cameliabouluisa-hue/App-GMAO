import { IsIn, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AffecterMaterielDto {
  @Type(() => Number)
  @IsInt()
  idMateriel?: number;

  @Type(() => Number)
  @IsInt()
  idPoint?: number;

  @IsIn(['GEOGRAPHIQUE', 'TECHNIQUE', 'MATERIEL'])
  typeArborescence?: 'GEOGRAPHIQUE' | 'TECHNIQUE' | 'MATERIEL';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ordre?: number;
}