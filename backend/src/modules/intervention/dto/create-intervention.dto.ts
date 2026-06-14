import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInterventionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  libelle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(50)
  typeMaintenance!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  typeIntervention?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  natureIntervention?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  priorite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  criticite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  centreCout?: string;

  @IsOptional()
  @IsInt()
  idMateriel?: number;

  @IsOptional()
  @IsInt()
  idPointStructure?: number;

  @IsOptional()
  @IsInt()
  idDemande?: number;

  @IsOptional()
  @IsInt()
  idGamme?: number;

  @IsOptional()
  @IsInt()
  idEquipe?: number;

  @IsOptional()
  @IsInt()
  idPlanPreventif?: number;

  @IsOptional()
  @IsInt()
  idPlanPreventifDeclencheur?: number;

  @IsOptional()
  @IsDateString()
  dateDebutPrevue?: string;

  @IsOptional()
  @IsDateString()
  dateFinPrevue?: string;

  @IsOptional()
  @IsDateString()
  dateSouhaiteeFin?: string;

  @IsOptional()
  @IsBoolean()
  dateFixe?: boolean;

  @IsOptional()
  @IsBoolean()
  aPlanifier?: boolean;

  @IsOptional()
  @IsBoolean()
  materielEnPanne?: boolean;

  @IsOptional()
  @IsBoolean()
  materielIndisponible?: boolean;

  @IsOptional()
  @IsBoolean()
  arretMateriel?: boolean;

  @IsOptional()
  @IsBoolean()
  receptionTravaux?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  symptome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  cause?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  remede?: string;

  @IsOptional()
  @IsString()
  diagnosticInitial?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  chargePrevue?: number;

  @IsOptional()
  @IsNumber()
  tempsArretPrevu?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;
}