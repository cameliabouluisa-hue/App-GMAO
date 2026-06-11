import type {
  Famille,
  Magasin,
  UniteArticle,
} from '../types/article';

const API_BASE_URL = 'http://localhost:3001';

async function parseApiError(res: Response, fallback: string) {
  const error = await res.json().catch(() => null);

  if (Array.isArray(error?.message)) {
    return error.message.join(', ');
  }

  return error?.message ?? fallback;
}

export async function getFamilles(): Promise<Famille[]> {
  const res = await fetch(`${API_BASE_URL}/familles`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, 'Erreur lors du chargement des familles.'),
    );
  }

  return res.json();
}

export async function getUnitesArticles(): Promise<UniteArticle[]> {
  const res = await fetch(`${API_BASE_URL}/unites-articles`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, "Erreur lors du chargement des unités d'articles."),
    );
  }

  return res.json();
}

export async function getMagasins(): Promise<Magasin[]> {
  const res = await fetch(`${API_BASE_URL}/magasins`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, 'Erreur lors du chargement des magasins.'),
    );
  }

  return res.json();
}