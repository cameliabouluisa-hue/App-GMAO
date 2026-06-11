'use client';

import { Select } from '@/components/select';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Eye,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Warehouse,
} from 'lucide-react';

import {
  getArticles,
  updateArticle,
} from '@/features/articles/services/article.service';

import type {
  Article,
  CategorieArticle,
} from '@/features/articles/types/article';

type ActifFilter = 'all' | 'true' | 'false';

type ArticleTypeFilter =
  | 'TOUS'
  | 'STOCK'
  | 'NON_STOCK'
  | 'MODELE'
  | 'SERIALISE'
  | 'LOT';

type CategorieFilter = 'TOUTES' | CategorieArticle;

const CATEGORIE_OPTIONS: Array<{
  label: string;
  value: CategorieFilter;
}> = [
  { label: 'Toutes les catégories', value: 'TOUTES' },
  { label: 'Pièce de rechange', value: 'PIECE_RECHANGE' },
  { label: 'Consommable', value: 'CONSOMMABLE' },
  { label: 'Fourniture', value: 'FOURNITURE' },
  { label: 'Outillage', value: 'OUTILLAGE' },
  { label: 'Équipement stocké', value: 'EQUIPEMENT_STOCKE' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Autre', value: 'AUTRE' },
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeArticle, setTypeArticle] = useState<ArticleTypeFilter>('TOUS');
  const [categorie, setCategorie] = useState<CategorieFilter>('TOUTES');
  const [actif, setActif] = useState<ActifFilter>('all');

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des articles.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const filteredArticles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          article.reference,
          article.designation,
          article.famille?.code,
          article.famille?.libelle,
          article.uniteArticle?.code,
          article.uniteArticle?.libelle,
          article.fournisseurPrincipal,
          article.fabricantArticle,
          article.referenceFabricant,
          article.codeBarres,
          article.centreCout,
          article.budget,
          article.codeComptable,
          article.natureAchat,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      const matchesCategorie =
        categorie === 'TOUTES' || article.categorie === categorie;

      const matchesActif =
        actif === 'all' ||
        (actif === 'true' && Boolean(article.actif)) ||
        (actif === 'false' && !Boolean(article.actif));

      const matchesType =
        typeArticle === 'TOUS' ||
        (typeArticle === 'STOCK' && article.gereEnStock) ||
        (typeArticle === 'NON_STOCK' && !article.gereEnStock) ||
        (typeArticle === 'MODELE' && article.estModele) ||
        (typeArticle === 'SERIALISE' && article.serialise) ||
        (typeArticle === 'LOT' && Boolean(article.gereParLot));

      return matchesSearch && matchesCategorie && matchesActif && matchesType;
    });
  }, [articles, search, categorie, actif, typeArticle]);

  const stats = useMemo(() => {
    return {
      total: articles.length,
      stockables: articles.filter((article) => article.gereEnStock).length,
      modeles: articles.filter((article) => article.estModele).length,
      serialises: articles.filter((article) => article.serialise).length,
      actifs: articles.filter((article) => Boolean(article.actif)).length,
    };
  }, [articles]);

  function resetFilters() {
    setSearch('');
    setTypeArticle('TOUS');
    setCategorie('TOUTES');
    setActif('all');
  }

  async function handleDisableOrRestore(article: Article) {
    const isActive = Boolean(article.actif);

    const message = isActive
      ? `Voulez-vous désactiver l’article "${article.designation}" ?`
      : `Voulez-vous restaurer l’article "${article.designation}" ?`;

    const ok = window.confirm(message);
    if (!ok) return;

    try {
      setActionLoading(true);
      setError('');

      await updateArticle(article.idArticle, {
        actif: !isActive,
        etatArticle: isActive ? 'INACTIF' : 'ACTIF',
        updatedBy: 'admin',
      });

      await loadArticles();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du traitement de l’article.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
              Module stock
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-950">
              Articles
            </h1>

            <p className="mt-1 text-base text-slate-500">
              Créez, consultez et gérez les articles, pièces de rechange,
              consommables et modèles stockables.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadArticles}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Actualiser
            </button>

            <Link
              href="/articles/nouveau"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
            >
              <Plus size={18} />
              Nouvel article
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <MiniStat
            icon={<Package size={18} />}
            label="Total"
            value={stats.total}
            tone="blue"
          />

          <MiniStat
            icon={<Warehouse size={18} />}
            label="Stockables"
            value={stats.stockables}
            tone="emerald"
          />

          <MiniStat
            icon={<PackageCheck size={18} />}
            label="Modèles"
            value={stats.modeles}
            tone="orange"
          />

          <MiniStat
            icon={<ShieldCheck size={18} />}
            label="Sérialisés"
            value={stats.serialises}
            tone="violet"
          />

          <MiniStat
            icon={<CheckCircle2 size={18} />}
            label="Actifs"
            value={stats.actifs}
            tone="green"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_240px_180px_auto]">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par code, libellé, famille, fournisseur, fabricant..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#0b3d4f] focus:bg-white"
              />
            </div>

            <Select
              value={typeArticle}
              onValueChange={(value: string) =>
                setTypeArticle(value as ArticleTypeFilter)
              }
              items={[
                { label: 'Tous les types', value: 'TOUS' },
                { label: 'Gérés en stock', value: 'STOCK' },
                { label: 'Non stockés', value: 'NON_STOCK' },
                { label: 'Modèles', value: 'MODELE' },
                { label: 'Sérialisés', value: 'SERIALISE' },
                { label: 'Gérés par lots', value: 'LOT' },
              ]}
            />

            <Select
              value={categorie}
              onValueChange={(value: string) =>
                setCategorie(value as CategorieFilter)
              }
              items={CATEGORIE_OPTIONS}
            />

            <Select
              value={actif}
              onValueChange={(value: string) => setActif(value as ActifFilter)}
              items={[
                { label: 'Tous', value: 'all' },
                { label: 'Actifs', value: 'true' },
                { label: 'Inactifs', value: 'false' },
              ]}
            />

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Réinitialiser
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Liste des articles
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {filteredArticles.length} article(s) affiché(s) sur{' '}
                {articles.length}
              </p>
            </div>

            {actionLoading && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Traitement en cours...
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-base font-semibold text-slate-500">
              Chargement des articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-bold text-slate-700">
                Aucun article trouvé.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Créez un nouvel article ou modifiez vos filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed text-left">
                <colgroup>
                  <col className="w-[180px]" />
                  <col />
                  <col className="w-[280px]" />
                  <col className="w-[130px]" />
                  <col className="w-[150px]" />
                </colgroup>

                <thead className="bg-slate-50">
                  <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">Article</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Statut</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.map((article) => (
                    <tr
                      key={article.idArticle}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex max-w-full truncate rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-800">
                          {article.reference || '-'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="truncate text-base font-black text-slate-900">
                          {article.designation || '-'}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {getCategorieLabel(article.categorie)}
                          {article.famille?.libelle
                            ? ` • ${article.famille.libelle}`
                            : ''}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <ArticleTypeBadge article={article} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge actif={Boolean(article.actif)} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <ActionLink
                            title="Voir"
                            href={`/articles/${article.idArticle}`}
                          >
                            <Eye size={17} />
                          </ActionLink>

                          <ActionLink
                            title="Modifier"
                            href={`/articles/${article.idArticle}/modifier`}
                          >
                            <Pencil size={17} />
                          </ActionLink>

                          <button
                            type="button"
                            title={article.actif ? 'Désactiver' : 'Restaurer'}
                            onClick={() => handleDisableOrRestore(article)}
                            className={`rounded-xl border p-2 transition ${
                              article.actif
                                ? 'border-red-100 text-red-600 hover:bg-red-50'
                                : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {article.actif ? (
                              <Trash2 size={17} />
                            ) : (
                              <RotateCcw size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'emerald' | 'orange' | 'violet' | 'green';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-green-50 text-green-700',
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>

        <p className="text-2xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function ArticleTypeBadge({ article }: { article: Article }) {
  const badges: ReactNode[] = [];

  if (article.gereEnStock) {
    badges.push(
      <TypeBadge key="stock" tone="emerald">
        Stockable
      </TypeBadge>,
    );
  }

  if (article.gereParLot) {
    badges.push(
      <TypeBadge key="lot" tone="blue">
        Lots
      </TypeBadge>,
    );
  }

  if (article.serialise) {
    badges.push(
      <TypeBadge key="serialise" tone="violet">
        Sérialisé
      </TypeBadge>,
    );
  }

  if (article.estModele) {
    badges.push(
      <TypeBadge key="modele" tone="orange">
        Modèle
      </TypeBadge>,
    );
  }

  if (badges.length === 0) {
    badges.push(
      <TypeBadge key="non-stock" tone="slate">
        Non stocké
      </TypeBadge>,
    );
  }

  return <div className="flex flex-wrap gap-1.5">{badges}</div>;
}

function TypeBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'emerald' | 'blue' | 'violet' | 'orange' | 'slate';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-500',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ actif }: { actif: boolean }) {
  return actif ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
      Actif
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
      Inactif
    </span>
  );
}

function ActionLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function getCategorieLabel(categorie?: CategorieArticle | null) {
  switch (categorie) {
    case 'PIECE_RECHANGE':
      return 'Pièce de rechange';
    case 'CONSOMMABLE':
      return 'Consommable';
    case 'FOURNITURE':
      return 'Fourniture';
    case 'OUTILLAGE':
      return 'Outillage';
    case 'EQUIPEMENT_STOCKE':
      return 'Équipement stocké';
    case 'SERVICE':
      return 'Service';
    case 'AUTRE':
      return 'Autre';
    default:
      return 'Non classé';
  }
}