import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TypePointStructure {
  GEOGRAPHIQUE = 'GEOGRAPHIQUE',
  TECHNIQUE = 'TECHNIQUE',
}

export enum TypeArborescence {
  GEOGRAPHIQUE = 'GEOGRAPHIQUE',
  TECHNIQUE = 'TECHNIQUE',
}

export enum EtatPointStructure {
  BROUILLON = 'BROUILLON',
  VALIDE = 'VALIDE',
  ARCHIVE = 'ARCHIVE',
}

export enum CriticitePointStructure {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  ELEVEE = 'ELEVEE',
  CRITIQUE = 'CRITIQUE',
}

function toBoolean({ value }: { value: unknown }) {
  if (value === true || value === false) return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
}

function trimString({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimNullableString({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function upperTrimString({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalInt({ value }: { value: unknown }) {
  if (value === '' || value === undefined || value === null) return null;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
}

export class CreatePointStructureDto {
  @Transform(upperTrimString)
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire.' })
  @MaxLength(50)
  code!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire.' })
  @MaxLength(100)
  libelle!: string;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsEnum(TypePointStructure)
  typePoint!: TypePointStructure;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsEnum(EtatPointStructure)
  etat?: EtatPointStructure;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categorie?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  responsable?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  organisation?: string | null;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  centreCout?: string | null;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  interventionsAutorisees?: boolean;

  @IsOptional()
  @IsEnum(CriticitePointStructure)
  criticite?: CriticitePointStructure;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  observationMaintenance?: string | null;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  zoneSensible?: boolean;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  accesRestreint?: boolean;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  epiObligatoire?: boolean;

  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  consigneSecurite?: string | null;

  @Transform(toOptionalInt)
  @IsOptional()
  @IsInt()
  @Min(1)
  parentPointId?: number | null;

  @IsOptional()
  @IsEnum(TypeArborescence)
  typeArborescence?: TypeArborescence;

  @Transform(toOptionalInt)
  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number | null;
}