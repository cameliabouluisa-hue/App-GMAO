import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AffecterEquipeDto {
  @IsInt()
  idEquipe!: number;

  @IsOptional()
  @IsString()
  assignedBy?: string;
}

export class AffecterTechnicienDto {
  @IsInt()
  idTechnicien!: number;

  @IsOptional()
  @IsInt()
  tempsTravail?: number;

  @IsOptional()
  @IsString()
  affectePar?: string;
}

export class DemarrerInterventionDto {
  @IsOptional()
  @IsDateString()
  dateDebutReelle?: string;

  @IsOptional()
  @IsString()
  startedBy?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class TerminerInterventionDto {
  @IsOptional()
  @IsDateString()
  dateFinReelle?: string;

  @IsOptional()
  @IsNumber()
  dureeReelle?: number;

  @IsOptional()
  @IsNumber()
  tempsArretReel?: number;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  reportedBy?: string;
}

export class ChangementEtatDto {
  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RefuserTravauxDto {
  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsString()
  motifRefusTravaux!: string;
}

export class ReporterInterventionDto {
  @IsDateString()
  nouvelleDateDebut!: string;

  @IsOptional()
  @IsDateString()
  nouvelleDateFin?: string;

  @IsOptional()
  @IsString()
  motifReport?: string;

  @IsOptional()
  @IsString()
  reportedBy?: string;
}