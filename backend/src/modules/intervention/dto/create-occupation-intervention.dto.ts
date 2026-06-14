import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOccupationInterventionDto {
  @IsOptional()
  @IsInt()
  idTechnicien?: number;

  @IsOptional()
  @IsInt()
  idOperation?: number;

  @IsDateString()
  dateOccupation!: string;

  @IsNumber()
  @Min(0.01)
  duree!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  natureOccupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  typeHoraire?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}