import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnnulerConsommationInterventionDto {
  @IsString()
  @IsNotEmpty()
  motifAnnulation: string;

  @IsOptional()
  @IsString()
  cancelledBy?: string;
}