import axios from '@/lib/api';

import type {
  Article,
  ChangeEtatMaterielDto,
  CreateMaterielDto,
  EtatMateriel,
  Materiel,
  Modele,
  PointStructure,
  TypeMateriel,
  UpdateCycleVieMaterielDto,
  UpdateMaterielDto,
} from '../types/materiel';

function toArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/* =========================
   CRUD MATÉRIEL
========================= */

export async function getMateriels(): Promise<Materiel[]> {
  const res = await axios.get('/materiels');
  return toArray<Materiel>(res.data);
}

export async function getMateriel(id: number): Promise<Materiel> {
  const res = await axios.get(`/materiels/${id}`);
  return res.data;
}

export async function createMateriel(
  data: CreateMaterielDto,
): Promise<Materiel> {
  const res = await axios.post('/materiels', data);
  return res.data;
}

export async function updateMateriel(
  id: number,
  data: UpdateMaterielDto,
): Promise<Materiel> {
  const res = await axios.patch(`/materiels/${id}`, data);
  return res.data;
}

// Désactivation logique : actif = false
export async function deleteMateriel(id: number): Promise<Materiel> {
  const res = await axios.delete(`/materiels/${id}`);
  return res.data;
}

// Réactivation : actif = true
export async function restoreMateriel(id: number): Promise<Materiel> {
  const res = await axios.patch(`/materiels/${id}/restore`);
  return res.data;
}

/* =========================
   CYCLE DE VIE
========================= */

export async function updateCycleVieMateriel(
  id: number,
  data: UpdateCycleVieMaterielDto,
): Promise<Materiel> {
  const res = await axios.patch(`/materiels/${id}/cycle-vie`, data);
  return res.data;
}

export async function changerEtatMateriel(
  id: number,
  data: ChangeEtatMaterielDto,
): Promise<Materiel> {
  const res = await axios.patch(`/materiels/${id}/changer-etat`, data);
  return res.data;
}

export async function verifierInterventionPossible(id: number): Promise<{
  possible: boolean;
  message: string;
  materiel: Materiel;
}> {
  const res = await axios.get(`/materiels/${id}/intervention-possible`);
  return res.data;
}

/* =========================
   RÉFÉRENTIELS FORMULAIRES
========================= */

export async function getArticles(): Promise<Article[]> {
  try {
    const res = await axios.get('/articles');
    return toArray<Article>(res.data);
  } catch {
    return [];
  }
}

export async function getModeles(): Promise<Modele[]> {
  try {
    const res = await axios.get('/modeles');
    return toArray<Modele>(res.data);
  } catch {
    return [];
  }
}

export async function getEtatsMateriel(): Promise<EtatMateriel[]> {
  try {
    const res = await axios.get('/materiels/referentiel/etats');
    return toArray<EtatMateriel>(res.data);
  } catch {
    return [];
  }
}

export async function getTypesMateriel(): Promise<TypeMateriel[]> {
  try {
    const res = await axios.get('/materiels/referentiel/types');
    return toArray<TypeMateriel>(res.data);
  } catch {
    return [];
  }
}

export async function getPointsStructure(): Promise<PointStructure[]> {
  try {
    const res = await axios.get('/points-structure');
    return toArray<PointStructure>(res.data);
  } catch {
    return [];
  }
}

export async function genererPlanPreventifDepuisPPP(
  idMateriel: number,
  idPlanPreventifPredefini: number,
): Promise<Materiel> {
  const res = await axios.post(
    `/materiels/${idMateriel}/generer-plan-preventif/${idPlanPreventifPredefini}`,
  );

  return res.data;
}