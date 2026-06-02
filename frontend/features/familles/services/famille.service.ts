import type { FamilleApi, FamilleFormValues } from '@/features/familles/types/famille';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type FamillePayload = {
  code?: string;
  libelle?: string;
  parent_id?: number | null;
  actif?: boolean;
  typeFamille?: string;
  natureAchat?: string | null;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Une erreur est survenue';

    try {
      const data = await response.json();
      message = data?.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return response.json();
}

function toPayload(values: FamilleFormValues): FamillePayload {
  return {
    code: values.code.trim(),
    libelle: values.libelle.trim(),
    parent_id: values.parentId ? Number(values.parentId) : null,
    actif: values.actif,
    typeFamille: values.typeFamille,
    natureAchat: values.natureAchat || null,
  };
}

export async function getFamilles(): Promise<FamilleApi[]> {
  const response = await fetch(`${API_URL}/familles`, {
    cache: 'no-store',
  });

  return handleResponse<FamilleApi[]>(response);
}

export async function getFamille(id: string | number): Promise<FamilleApi> {
  const response = await fetch(`${API_URL}/familles/${id}`, {
    cache: 'no-store',
  });

  return handleResponse<FamilleApi>(response);
}

export async function createFamille(values: FamilleFormValues): Promise<FamilleApi> {
  const response = await fetch(`${API_URL}/familles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toPayload(values)),
  });

  return handleResponse<FamilleApi>(response);
}

export async function updateFamille(
  id: string | number,
  values: FamilleFormValues,
): Promise<FamilleApi> {
  const response = await fetch(`${API_URL}/familles/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toPayload(values)),
  });

  return handleResponse<FamilleApi>(response);
}

export async function deleteFamille(id: string | number): Promise<FamilleApi> {
  const response = await fetch(`${API_URL}/familles/${id}`, {
    method: 'DELETE',
  });

  return handleResponse<FamilleApi>(response);
}