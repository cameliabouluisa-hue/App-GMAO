import { Article, CreateArticleDto, UpdateArticleDto } from '../types/article';

const API_URL = 'http://localhost:3001/articles';

async function parseApiError(res: Response, fallback: string) {
  const error = await res.json().catch(() => null);

  if (Array.isArray(error?.message)) {
    return error.message.join(', ');
  }

  return error?.message ?? fallback;
}

export async function getArticles(): Promise<Article[]> {
  const res = await fetch(API_URL, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, 'Erreur lors du chargement des articles.'),
    );
  }

  return res.json();
}

export async function getArticleById(id: number): Promise<Article> {
  const res = await fetch(`${API_URL}/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Article introuvable.'));
  }

  return res.json();
}

export async function createArticle(data: CreateArticleDto): Promise<Article> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, "Erreur lors de la création de l'article."),
    );
  }

  return res.json();
}

export async function updateArticle(
  id: number,
  data: UpdateArticleDto,
): Promise<Article> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, "Erreur lors de la modification de l'article."),
    );
  }

  return res.json();
}

export async function deleteArticle(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Suppression impossible.'));
  }
}