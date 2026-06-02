export type TypePointStructure = 'GEOGRAPHIQUE' | 'TECHNIQUE';

export type TypeArborescence = 'GEOGRAPHIQUE' | 'TECHNIQUE';

export type TypePointStructureFilter = TypePointStructure | 'TOUS';

export type EtatPoint = 'BROUILLON' | 'VALIDE' | 'ARCHIVE';

export type EtatPointFilter = EtatPoint | 'TOUS';

export type CriticitePoint = 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';

export type CriticitePointFilter = CriticitePoint | 'TOUS';

export type ActifFilter = 'true' | 'false' | 'all';

export interface PointStructureParentOption {
  idPoint: number;
  code: string | null;
  libelle: string | null;
  typePoint: TypePointStructure;
  typeArborescence?: TypeArborescence | null;
}

export interface PointStructurePlacement {
  idLien?: number;
  typeArborescence: TypeArborescence;
  parentPointId: number | null;
  parent?: PointStructureParentOption | null;
  ordre?: number | null;
}

export interface PointStructureListItem {
  idPoint: number;
  code: string | null;
  libelle: string | null;
  description: string | null;

  typePoint: TypePointStructure;
  typeArborescence?: TypeArborescence | null;

  actif: boolean;
  etat: EtatPoint;

  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean;
  criticite?: CriticitePoint;
  observationMaintenance?: string | null;

  zoneSensible?: boolean;
  accesRestreint?: boolean;
  epiObligatoire?: boolean;
  consigneSecurite?: string | null;

  parentPointId?: number | null;
  ordre?: number | null;

  placement?: PointStructurePlacement | null;
  liensArborescence?: unknown[];
  parent?: PointStructureParentOption | null;

  materielsCount?: number;
  nbMateriels?: number;

  nbGammesOperations?: number;
  nbPlansPreventifs?: number;
  nbDeclencheursPreventifs?: number;
  nbHistoriquesPreventifs?: number;
}

export interface PointStructureMateriel {
  idMateriel: number;
  code: string | null;
  numeroSerie: string | null;
  actif: boolean | null;
}

export interface PointStructureDetail extends PointStructureListItem {
  materiels?: PointStructureMateriel[];
  liens?: unknown[];
}

export interface CreatePointStructureDto {
  code: string;
  libelle: string;
  description?: string | null;

  typePoint: TypePointStructure;
  typeArborescence: TypeArborescence;

  actif?: boolean;
  etat?: EtatPoint;

  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean;
  criticite?: CriticitePoint;
  observationMaintenance?: string | null;

  zoneSensible?: boolean;
  accesRestreint?: boolean;
  epiObligatoire?: boolean;
  consigneSecurite?: string | null;

  parentPointId?: number | null;
  ordre?: number | null;
}

export interface UpdatePointStructureDto {
  code?: string;
  libelle?: string;
  description?: string | null;

  typePoint?: TypePointStructure;
  typeArborescence?: TypeArborescence;

  actif?: boolean;
  etat?: EtatPoint;

  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean;
  criticite?: CriticitePoint;
  observationMaintenance?: string | null;

  zoneSensible?: boolean;
  accesRestreint?: boolean;
  epiObligatoire?: boolean;
  consigneSecurite?: string | null;

  parentPointId?: number | null;
  ordre?: number | null;
}

export interface FindPointsStructureQuery {
  search?: string;
  typePoint?: TypePointStructureFilter;
  typeArborescence?: TypePointStructureFilter;
  actif?: ActifFilter;
  etat?: EtatPointFilter;
  categorie?: string;
  criticite?: CriticitePointFilter;
}

export interface PointStructureStats {
  total: number;
  geographiques: number;
  techniques: number;
  actifs: number;
  inactifs?: number;
}

export interface PointStructureActionResponse {
  message?: string;
}