import { ArborescenceNode } from '../types/arborescence.types';

const API_URL = 'http://localhost:3001';

async function fetchTree(endpoint: string, errorMessage: string): Promise<ArborescenceNode[]> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(errorMessage);
  }

  return res.json();
}

export function getArborescenceGeographique() {
  return fetchTree(
    '/arborescence/geographique/tree',
    "Erreur lors du chargement de l'arborescence géographique",
  );
}

export function getArborescenceTechnique() {
  return fetchTree(
    '/arborescence/technique/tree',
    "Erreur lors du chargement de l'arborescence technique",
  );
}