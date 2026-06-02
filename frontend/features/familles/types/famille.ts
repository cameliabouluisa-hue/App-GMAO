import type { Modele } from '@/types/modele';


export type NatureAchatFamille =
  | ''
  | 'CONSOMMABLE'
  | 'PNEUMATIQUE'
  | 'ELECTRIQUE'
  | 'MECANIQUE'
  | 'HYDRAULIQUE'
  | 'AUTRE';

export type TypeFamille = 'EQUIPEMENT' | 'ARTICLE' | 'MIXTE';

export type FamilleApi = {
  idFamille: number;
  code: string | null;
  libelle: string | null;
  parent_id: number | null;

 
  actif?: boolean | null;
  natureAchat?: NatureAchatFamille | null;
  typeFamille?: TypeFamille | null;

  modele?: Modele[];
};

export type FamilleNode = FamilleApi & {
  children: FamilleNode[];
};

export type FamilleFlatRow = {
  node: FamilleNode;
  level: number;
};

export type FamilleFilterType = 'all' | 'parents' | 'withModels';

export type CreateFamillePayload = {
  code: string;
  libelle: string;
  parent_id: number | null;
  actif: boolean;
  natureAchat: NatureAchatFamille | null;
  typeFamille: TypeFamille;
};

export type UpdateFamillePayload = Partial<CreateFamillePayload>;

export type FamilleFormValues = {
  code: string;
  libelle: string;
  parentId: string;
  actif: boolean;
  natureAchat: NatureAchatFamille;
  typeFamille: TypeFamille;
};