export type CategorieArticle =
  | 'PIECE_RECHANGE'
  | 'CONSOMMABLE'
  | 'FOURNITURE'
  | 'OUTILLAGE'
  | 'EQUIPEMENT_STOCKE'
  | 'SERVICE'
  | 'AUTRE';

export type EtatArticle = 'ACTIF' | 'INACTIF';

export type Famille = {
  idFamille: number;
  code: string | null;
  libelle: string | null;
};

export type UniteArticle = {
  idUniteArticle: number;
  code: string;
  libelle: string;
};

export type Magasin = {
  idMagasin: number;
  code: string;
  libelle: string;
  actif: boolean;
};

export type ModeleEquipement = {
  idModele: number;
  code: string | null;
  libelle: string | null;
  idArticle?: number | null;
  idFamille?: number | null;
  idEtat?: number | null;
  actif?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type StockInitialMaterielDto = {
  code: string;
  numeroSerie?: string;
  libelle?: string;
};

export type StockInitialDto = {
  idMagasin: number;
  quantite: number;
  prixUnitaire?: number;
  numeroLot?: string;
  datePeremption?: string;
  observation?: string;
  materiels?: StockInitialMaterielDto[];
};

export type Article = {
  idArticle: number;

  reference: string;
  designation: string;
  description?: string | null;

  etatArticle?: EtatArticle | string | null;
  categorie?: CategorieArticle | null;

  idFamille?: number | null;
  idUniteArticle?: number | null;

  fournisseurPrincipal?: string | null;
  fabricantArticle?: string | null;
  referenceFabricant?: string | null;
  nbDecimales?: number | null;
  codeBarres?: string | null;

  centreCout?: string | null;
  budget?: string | null;
  codeComptable?: string | null;
  natureAchat?: string | null;
  taxe?: string | null;
  prixStandard?: number | string | null;
  prixMoyenPondere?: number | string | null;

  gereEnStock: boolean;
  gereParLot?: boolean;
  serialise: boolean;
  estModele: boolean;

  reparable?: boolean;
  actif: boolean;

  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;

  famille?: Famille | null;
  uniteArticle?: UniteArticle | null;
  modeleEquipement?: ModeleEquipement | null;

  consommations?: unknown[];
  stocks?: unknown[];
};

export type CreateArticleDto = {
  reference: string;
  designation: string;
  description?: string;

  etatArticle?: EtatArticle | string;
  categorie?: CategorieArticle;

  idFamille?: number;
  idUniteArticle?: number;

  fournisseurPrincipal?: string;
  fabricantArticle?: string;
  referenceFabricant?: string;
  nbDecimales?: number;
  codeBarres?: string;

  centreCout?: string;
  budget?: string;
  codeComptable?: string;
  natureAchat?: string;
  taxe?: string;
  prixStandard?: number;
  prixMoyenPondere?: number;

  gereEnStock?: boolean;
  gereParLot?: boolean;
  serialise?: boolean;
  estModele?: boolean;

  reparable?: boolean;
  actif?: boolean;

  createdBy?: string;
  updatedBy?: string;

  stockInitial?: StockInitialDto;
};

export type UpdateArticleDto = Partial<CreateArticleDto>;