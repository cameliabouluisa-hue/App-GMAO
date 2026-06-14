import axios from '@/lib/api';

import type {
  ActionDemandeInterventionDto,
  CreateDemandeInterventionDto,
  DemandeIntervention,
  DemandeInterventionFilters,
  RefuserDemandeInterventionDto,
  RefuserTravauxDemandeDto,
  UpdateDemandeInterventionDto,
} from '../types/demande-intervention.types';

const BASE_URL = '/demandes-intervention';

export async function getDemandesIntervention(
  filters?: DemandeInterventionFilters,
): Promise<DemandeIntervention[]> {
  const params = new URLSearchParams();

  if (filters?.statut) {
    params.set('statut', filters.statut);
  }

  if (filters?.priorite) {
    params.set('priorite', filters.priorite);
  }

  if (filters?.idMateriel) {
    params.set('idMateriel', String(filters.idMateriel));
  }

  const query = params.toString();
  const res = await axios.get<DemandeIntervention[]>(
    query ? `${BASE_URL}?${query}` : BASE_URL,
  );

  return res.data;
}

export async function getDemandeIntervention(
  idDemande: number,
): Promise<DemandeIntervention> {
  const res = await axios.get<DemandeIntervention>(
    `${BASE_URL}/${idDemande}`,
  );

  return res.data;
}

export async function createDemandeIntervention(
  data: CreateDemandeInterventionDto,
): Promise<DemandeIntervention> {
  const res = await axios.post<DemandeIntervention>(BASE_URL, data);
  return res.data;
}

export async function updateDemandeIntervention(
  idDemande: number,
  data: UpdateDemandeInterventionDto,
): Promise<DemandeIntervention> {
  const res = await axios.patch<DemandeIntervention>(
    `${BASE_URL}/${idDemande}`,
    data,
  );

  return res.data;
}

export async function deleteDemandeIntervention(
  idDemande: number,
): Promise<DemandeIntervention> {
  const res = await axios.delete<DemandeIntervention>(
    `${BASE_URL}/${idDemande}`,
  );

  return res.data;
}

export async function soumettreDemandeIntervention(
  idDemande: number,
  data: ActionDemandeInterventionDto = {},
): Promise<DemandeIntervention> {
  const res = await axios.post<DemandeIntervention>(
    `${BASE_URL}/${idDemande}/soumettre`,
    data,
  );

  return res.data;
}

export async function accepterDemandeIntervention(
  idDemande: number,
  data: ActionDemandeInterventionDto = {},
): Promise<DemandeIntervention> {
  const res = await axios.post<
    DemandeIntervention | { demande: DemandeIntervention }
  >(
    `${BASE_URL}/${idDemande}/accepter`,
    data,
  );

  return 'demande' in res.data ? res.data.demande : res.data;
}

export async function refuserDemandeIntervention(
  idDemande: number,
  data: RefuserDemandeInterventionDto,
): Promise<DemandeIntervention> {
  const res = await axios.post<DemandeIntervention>(
    `${BASE_URL}/${idDemande}/refuser`,
    data,
  );

  return res.data;
}

export async function accepterTravauxDemandeIntervention(
  idDemande: number,
  data: ActionDemandeInterventionDto = {},
): Promise<DemandeIntervention> {
  const res = await axios.post<DemandeIntervention>(
    `${BASE_URL}/${idDemande}/accepter-travaux`,
    data,
  );

  return res.data;
}

export async function refuserTravauxDemandeIntervention(
  idDemande: number,
  data: RefuserTravauxDemandeDto,
): Promise<DemandeIntervention> {
  const res = await axios.post<DemandeIntervention>(
    `${BASE_URL}/${idDemande}/refuser-travaux`,
    data,
  );

  return res.data;
}
