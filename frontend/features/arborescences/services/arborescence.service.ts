import type { ArborescenceNode } from '../types/arborescence.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchTree(endpoint: string): Promise<ArborescenceNode[]> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Erreur chargement arborescence : ${res.status}`);
  }

  const data = await res.json();

  return Array.isArray(data) ? data : [];
}

export async function getArborescenceGeographique(): Promise<
  ArborescenceNode[]
> {
  return fetchTree('/arborescence/geographique/tree');
}

export async function getArborescenceTechnique(): Promise<ArborescenceNode[]> {
  return fetchTree('/arborescence/technique/tree');
}

export async function getArborescenceFamilles(): Promise<ArborescenceNode[]> {
  return fetchTree('/arborescence/familles/tree');
}