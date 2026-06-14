import { IsOptional, IsString } from 'class-validator';

export class ActionDemandeInterventionDto {
  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RefuserDemandeInterventionDto {
  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsString()
  motifRefus!: string;
}

export class RefuserTravauxDemandeDto {
  @IsOptional()
  @IsString()
  utilisateur?: string;

  @IsString()
  motifRefusTravaux!: string;
}