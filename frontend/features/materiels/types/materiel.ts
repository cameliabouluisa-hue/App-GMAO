export type Article = {
  idArticle: number;
  reference?: string | null;
  code?: string | null;
  designation?: string | null;
  libelle?: string | null;
  description?: string | null;

  centreCout?: string | null;
  budget?: string | null;
  codeComptable?: string | null;

  fabricantArticle?: string | null;
  referenceFabricant?: string | null;

  estModele?: boolean;
  gereEnStock?: boolean;
  serialise?: boolean;
  reparable?: boolean;
  actif?: boolean;
};

export type Famille = {
  idFamille: number;
  code?: string | null;
  libelle?: string | null;
  actif?: boolean | null;
};

export type Fabricant = {
  idFabricant: number;
  code?: string | null;
  nom?: string | null;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  actif?: boolean | null;
};

export type Marque = {
  idMarque: number;
  code?: string | null;
  libelle?: string | null;
  description?: string | null;
  idFabricant?: number | null;
  actif?: boolean | null;

  fabricant?: Fabricant | null;
};

export type TypeEquipement = {
  idTypeEquipement: number;
  code ?: string;
  libelle: string;
  description?: string | null;
  actif?: boolean;
};

export type EtatModele = {
  idEtat: number;
  libelle?: string | null;
};

export type PlanPreventifPredefini = {
  idPlanPreventifPredefini: number;
  code: string;
  titre?: string | null;
  etat?: string | null;
  typeDeclenchement?: string | null;
  organisation?: string | null;
  idModele?: number | null;
  actif?: boolean | null;

  principal?: boolean;
  actifAssociation?: boolean;
  idModelePlanPreventifPredefini?: number;
  origineAssociation?: 'MODELE_DIRECT' | 'TABLE_LIAISON' | string;
};

export type PlanPreventifDeclencheur = {
  idPlanPreventifDeclencheur: number;
  idPlanPreventif: number;
  priorite?: number | null;
  etat?: string | null;
  typeDeclencheur?: string | null;
  idGamme?: number | null;
  idPointStructure?: number | null;
  idMateriel?: number | null;
  idPointMesure?: number | null;
  idModele?: number | null;

  prochainLancementDate?: string | null;
  derniereRealisationDate?: string | null;
  horizonJours?: number | null;
  toleranceJours?: number | null;

  periodiciteValeur?: number | null;
  periodiciteUnite?: string | null;

  seuilValeur?: number | string | null;
  operateur?: string | null;
  actif?: boolean | null;

  plan_preventif?: PlanPreventif | null;
  point_mesure?: PointMesure | null;
};

export type PlanPreventif = {
  idPlanPreventif: number;
  code?: string | null;
  libelle?: string | null;
  titre?: string | null;
  etat?: string | null;
  typeDeclenchement?: string | null;

  idMateriel?: number | null;
  idPointStructure?: number | null;
  idPlanPreventifPredefiniSource?: number | null;

  organisation?: string | null;
  actif?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  plan_preventif_predefini?: PlanPreventifPredefini | null;
  

plan_preventif_declencheur?: {
  idPlanPreventifDeclencheur: number;
  priorite?: number | null;
  typeDeclencheur: string;
  periodiciteValeur?: number | null;
  periodiciteUnite?: string | null;
  prochainLancementDate?: string | null;
  prochainLancementValeur?: number | string | null;
  operateur?: string | null;
  seuilValeur?: number | string | null;

  gamme?: {
    idGamme: number;
    code?: string | null;
    libelle?: string | null;
  } | null;

  point_mesure?: {
    idPointMesure: number;
    code?: string | null;
    libelle?: string | null;
    unite?: string | null;
  } | null;
}[];
};

export type PointMesure = {
  idPointMesure: number;
  code: string;
  libelle: string;

  type: string;
  unite?: string | null;
  organisation?: string | null;

  idPointStructure?: number | null;
  idMateriel?: number | null;

  valeurMin?: number | string | null;
  valeurMax?: number | string | null;
  nbDecimales?: number | null;
  periodeReleveJours?: number | null;

  surveillanceMin?: number | string | null;
  surveillanceMax?: number | string | null;
  correctionMin?: number | string | null;
  correctionMax?: number | string | null;

  emettreDi?: boolean;
  envoyerAlerte?: boolean;

  derniereValeur?: number | string | null;
  derniereDate?: string | null;

  actif?: boolean | null;
};

export type Modele = {
  idModele: number;
  code?: string | null;
  libelle?: string | null;

  idArticle?: number | null;
  idFamille?: number | null;
  idEtat?: number | null;
  idTypeEquipement?: number | null;
  idFabricant?: number | null;
  idMarque?: number | null;

  referenceConstructeur?: string | null;
  version?: string | null;
  commentaire?: string | null;

  criticite?: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE' | string | null;
  niveauMaintenance?:
    | 'NIVEAU_1'
    | 'NIVEAU_2'
    | 'NIVEAU_3'
    | 'NIVEAU_4'
    | 'NIVEAU_5'
    | string
    | null;

  dureeVie?: number | null;
  garantieMois?: number | null;
  reparable?: boolean | null;

  budget?: number | string | null;
  coutMaintenancePrevu?: number | string | null;

  poidsKg?: number | string | null;
  longueur?: number | string | null;
  largeur?: number | string | null;
  hauteur?: number | string | null;

  actif?: boolean | null;

  article?: Article | null;
  famille?: Famille | null;
  etat_modele?: EtatModele | null;
  type_equipement?: TypeEquipement | null;
  fabricant?: Fabricant | null;
  marque?: Marque | null;

  plan_preventif_predefini?: PlanPreventifPredefini[];

  modele_plan_preventif_predefini?: {
    idModelePlanPreventifPredefini: number;
    idModele: number;
    idPlanPreventifPredefini: number;
    principal: boolean;
    actif: boolean;
    plan_preventif_predefini: PlanPreventifPredefini;
  }[];
};

export type EtatMateriel = {
  idEtat: number;
  code?: string | null;
  libelle?: string | null;
};

export type TypeMateriel = {
  idType: number;
  libelle?: string | null;
};

export type PointStructure = {
  idPoint: number;
  code: string | null;
  libelle: string | null;
  description?: string | null;

  typePoint: 'GEOGRAPHIQUE' | 'TECHNIQUE' | string | null;
  actif?: boolean | null;

  etat?: string | null;
  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean | null;
  criticite?: string | null;
  observationMaintenance?: string | null;

  zoneSensible?: boolean | null;
  accesRestreint?: boolean | null;
  epiObligatoire?: boolean | null;
  consigneSecurite?: string | null;
};

export type Magasin = {
  idMagasin: number;
  code: string;
  libelle: string;
  actif?: boolean;
};

export type EmplacementMagasin = {
  idEmplacement: number;
  idMagasin: number;
  code: string;
  libelle: string;
  actif?: boolean;
};

export type EntreeStock = {
  idEntreeStock: number;
  numero: string;
  dateReception: string;
  commentaire?: string | null;
  statut: string;
};

export type EntreeStockLigne = {
  idLigneEntreeStock: number;
  idEntreeStock: number;
  idArticle: number;
  idMagasin: number;
  idEmplacement?: number | null;

  quantite?: number | string | null;
  prixUnitaire?: number | string | null;
  numeroLot?: string | null;
  datePeremption?: string | null;
  commentaire?: string | null;

  entreeStock?: EntreeStock | null;
  article?: Article | null;
  magasin?: Magasin | null;
  emplacement?: EmplacementMagasin | null;
};

export type MouvementStock = {
  idMouvement: number;
  typeMouvement: string;
  dateMouvement: string;
  quantite: number | string;

  idArticle: number;
  idMateriel?: number | null;
  idMagasinSource?: number | null;
  idMagasinDestination?: number | null;

  origineType?: string | null;
  origineId?: number | null;
  commentaire?: string | null;

  article?: Article | null;
  magasinSource?: Magasin | null;
  magasinDestination?: Magasin | null;
};

export type InventairePrepare = {
  idInventairePrepare: number;
  numero: string;
  dateCreation: string;
  dateComptage?: string | null;
  dateValidation?: string | null;
  statut: string;
  commentaire?: string | null;
};

export type LigneInventairePrepare = {
  idLigneInventairePrepare: number;
  idInventairePrepare: number;
  idArticle: number;
  idMateriel?: number | null;

  quantiteTheorique?: number | string | null;
  quantiteReelle?: number | string | null;
  ecart?: number | string | null;
  commentaire?: string | null;

  inventairePrepare?: InventairePrepare | null;
  article?: Article | null;
};

export type SortieStock = {
  idSortieStock: number;
  numero: string;
  dateSortie: string;
  commentaire?: string | null;
  statut: string;
};

export type SortieStockLigne = {
  idLigneSortieStock: number;
  idSortieStock: number;
  idArticle: number;
  idMagasin: number;
  idEmplacement?: number | null;
  idMateriel?: number | null;

  quantite?: number | string | null;
  prixUnitaire?: number | string | null;
  commentaire?: string | null;

  sortieStock?: SortieStock | null;
  article?: Article | null;
  magasin?: Magasin | null;
  emplacement?: EmplacementMagasin | null;
};

export type Intervention = {
  idIntervention: number;
  code?: string | null;
  typeMaintenance?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  etat?: string | null;
  priorite?: string | null;
  description?: string | null;

  idMateriel?: number | null;
  idDemande?: number | null;
  idGamme?: number | null;
  idPlanPreventif?: number | null;
};

export type Materiel = {
  idMateriel: number;

  code: string | null ;
  libelle: string | null;
  numeroSerie: string | null;

  dateMiseService: string | null;
  dateDernierInventaire: string | null;
  dateRebut: string | null;
  motifRebut: string | null;

  dateFinGarantiePrevisionnelle?: string | null;

  gereEnStock: boolean;
  positionActuelle: string | null;

  idModele: number | null;
  idEtat: number | null;
  idType: number | null;
  idPointStructure: number | null;
  idMaterielParent: number | null;
  idLigneEntreeStock: number | null;

  actif: boolean | null;

  modele?: Modele | null;
  etat_materiel?: EtatMateriel | null;
  type_materiel?: TypeMateriel | null;
  point_structure?: PointStructure | null;

  entreeStockLigne?: EntreeStockLigne | null;

  materielParent?: Materiel | null;
  sousMateriels?: Materiel[];

  points_mesure?: PointMesure[];

  plan_preventif?: PlanPreventif[];
  plan_preventif_declencheur?: PlanPreventifDeclencheur[];

  plansPreventifsPredefinisModele?: PlanPreventifPredefini[];

  intervention?: Intervention[];
  mouvementsStock?: MouvementStock[];
  lignesInventairePrepare?: LigneInventairePrepare[];
  lignesSortieStock?: SortieStockLigne[];

  createdAt?: string;
  updatedAt?: string;
};

export type CreateMaterielDto = {
  code?: string | null;
  libelle?: string | null;
  numeroSerie?: string | null;

  dateMiseService?: string | null;
  dateDernierInventaire?: string | null;
  dateRebut?: string | null;
  motifRebut?: string | null;

  gereEnStock?: boolean;
  positionActuelle?: string | null;

  idModele?: number | null;
  idEtat?: number | null;
  idType?: number | null;
  idPointStructure?: number | null;
  idMaterielParent?: number | null;
  idLigneEntreeStock?: number | null;

  actif?: boolean;
};

export type UpdateMaterielDto = Partial<CreateMaterielDto>;

export type UpdateCycleVieMaterielDto = {
  idEtat?: number | null;
  dateDernierInventaire?: string | null;
  dateMiseService?: string | null;
  dateRebut?: string | null;
  motifRebut?: string | null;
};

export type ChangeEtatMaterielDto = {
  idEtat: number;
  motif?: string | null;
};
export type GenererPlanPreventifResponse = Materiel;