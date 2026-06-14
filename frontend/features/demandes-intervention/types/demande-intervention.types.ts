export type PrioriteDemandeIntervention =
  | 'BASSE'
  | 'NORMALE'
  | 'HAUTE'
  | 'URGENTE';

export type CriticiteDemandeIntervention =
  | 'FAIBLE'
  | 'MOYENNE'
  | 'ELEVEE'
  | 'CRITIQUE';

export type StatutDemandeIntervention =
  | 'EN_PREPARATION'
  | 'ATTENTE_PRISE_EN_COMPTE'
  | 'ATTENTE_REALISATION'
  | 'TERMINE'
  | 'REFUSE'
  | 'SOLDE'
  | 'ANNULE'
  | string;

export type MaterielLite = {
  idMateriel: number;
  code?: string | null;
  libelle?: string | null;
  numeroSerie?: string | null;
};

export type InterventionLite = {
  idIntervention: number;
  code?: string | null;
  libelle?: string | null;
  etat?: string | null;
  typeMaintenance?: string | null;
};

export type HistoriqueEtatDemandeIntervention = {
  idHistorique?: number;
  idHistoriqueEtatDemande?: number;
  ancienEtat?: string | null;
  nouvelEtat?: string | null;
  action?: string | null;
  commentaire?: string | null;
  changedBy?: string | null;
  createdBy?: string | null;
  dateChangement?: string | null;
  changedAt?: string | null;
  createdAt?: string | null;
};

export type DemandeIntervention = {
  idDemande: number;

  code?: string | null;
  dateDemande?: string | null;

  description?: string | null;
  statut?: StatutDemandeIntervention | null;

  idMateriel?: number | null;
  materiel?: MaterielLite | null;

  createdBy?: string | null;
  demandeur?: string | null;

  dateSoumission?: string | null;
  dateValidation?: string | null;

  motifRefus?: string | null;
  priorite?: PrioriteDemandeIntervention | string | null;
  criticite?: CriticiteDemandeIntervention | string | null;

  validatedBy?: string | null;

  receptionTravaux?: boolean;
  materielEnPanne?: boolean;
  materielIndisponible?: boolean;

  dateReceptionTravaux?: string | null;
  receptionBy?: string | null;
  motifRefusTravaux?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  intervention?: InterventionLite[];
  historiquesEtat?: HistoriqueEtatDemandeIntervention[];
};

export type CreateDemandeInterventionDto = {
  code?: string;
  dateDemande?: string;

  description?: string;
  idMateriel?: number | null;

  createdBy?: string;
  demandeur?: string;

  priorite?: PrioriteDemandeIntervention;
  criticite?: CriticiteDemandeIntervention;

  receptionTravaux?: boolean;
  materielEnPanne?: boolean;
  materielIndisponible?: boolean;
};

export type UpdateDemandeInterventionDto = Partial<CreateDemandeInterventionDto> & {
  statut?: StatutDemandeIntervention;
  motifRefus?: string;
  validatedBy?: string;
  receptionBy?: string;
  motifRefusTravaux?: string;
};

export type DemandeInterventionFilters = {
  statut?: string;
  idMateriel?: number | string;
  priorite?: string;
};

export type ActionDemandeInterventionDto = {
  utilisateur?: string;
  commentaire?: string;
};

export type RefuserDemandeInterventionDto = {
  utilisateur?: string;
  motifRefus: string;
};

export type RefuserTravauxDemandeDto = {
  utilisateur?: string;
  motifRefusTravaux: string;
};