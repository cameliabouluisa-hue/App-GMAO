'use client';

import { Select } from '@/components/select';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Building2,
  CheckCircle2,
  Eye,
  GitBranch,
  MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';

import {
  deletePointStructure,
  getPointsStructure,
  restorePointStructure,
} from '@/features/points-structure/services/point-structure.service';

import {
  ActifFilter,
  PointStructureListItem,
  TypePointStructureFilter,
} from '@/features/points-structure/types/point-structure.type';

export default function PointsStructurePage() {
  const [points, setPoints] = useState<PointStructureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typePoint, setTypePoint] =
    useState<TypePointStructureFilter>('TOUS');
  const [actif, setActif] = useState<ActifFilter>('all');

  const loadPoints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getPointsStructure({
        search,
        typePoint,
        actif,
      });

      setPoints(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des points de structure.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, typePoint, actif]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPoints();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadPoints]);

  const stats = useMemo(() => {
    return {
      total: points.length,
      geographiques: points.filter(
        (p) => p.typePoint === 'GEOGRAPHIQUE',
      ).length,
      techniques: points.filter((p) => p.typePoint === 'TECHNIQUE').length,
      actifs: points.filter((p) => Boolean(p.actif)).length,
    };
  }, [points]);

  const resetFilters = () => {
    setSearch('');
    setTypePoint('TOUS');
    setActif('all');
  };

  const handleDeleteOrRestore = async (point: PointStructureListItem) => {
    const message = point.actif
      ? `Voulez-vous désactiver le point "${point.libelle}" ?`
      : `Voulez-vous restaurer le point "${point.libelle}" ?`;

    const ok = window.confirm(message);
    if (!ok) return;

    try {
      setActionLoading(true);
      setError('');

      if (point.actif) {
        await deletePointStructure(point.idPoint);
      } else {
        await restorePointStructure(point.idPoint);
      }

      await loadPoints();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du traitement du point.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
              Module équipements
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-950">
              Points de structure
            </h1>

            <p className="mt-1 text-base text-slate-500">
              Créez, consultez et gérez les points géographiques et techniques.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/arborescences"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <MapPin size={18} />
              Arborescence
            </Link>

            <button
              type="button"
              onClick={loadPoints}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Actualiser
            </button>

            <Link
              href="/points-structure/nouveau"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
            >
              <Plus size={18} />
              Nouveau point
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MiniStat
            icon={<GitBranch size={18} />}
            label="Total"
            value={stats.total}
            tone="blue"
          />

          <MiniStat
            icon={<Building2 size={18} />}
            label="Géographiques"
            value={stats.geographiques}
            tone="emerald"
          />

          <MiniStat
            icon={<Wrench size={18} />}
            label="Techniques"
            value={stats.techniques}
            tone="orange"
          />

          <MiniStat
            icon={<CheckCircle2 size={18} />}
            label="Actifs"
            value={stats.actifs}
            tone="violet"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code, libellé ou description..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#0b3d4f] focus:bg-white"
              />
            </div>

            <Select
              value={typePoint}
              onValueChange={(value: string) =>
                setTypePoint(value as TypePointStructureFilter)
              }
              items={[
                { label: 'Tous les types', value: 'TOUS' },
                { label: 'Géographiques', value: 'GEOGRAPHIQUE' },
                { label: 'Techniques', value: 'TECHNIQUE' },
              ]}
            />

            <Select
              value={actif}
              onValueChange={(value: string) =>
                setActif(value as ActifFilter)
              }
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
                Liste des points
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {points.length} point(s) enregistré(s)
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
              Chargement des points de structure...
            </div>
          ) : points.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-bold text-slate-700">
                Aucun point trouvé.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Créez un nouveau point ou modifiez vos filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-left">
                <colgroup>
                  <col className="w-[130px]" />
                  <col />
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                  <col className="w-[110px]" />
                  <col className="w-[150px]" />
                </colgroup>

                <thead className="bg-slate-50">
                  <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Libellé</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Statut</th>
                    <th className="px-4 py-4">Matériels</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {points.map((point) => (
                    <tr
                      key={point.idPoint}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-4">
                        <span className="inline-flex max-w-full truncate rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-800">
                          {point.code || '-'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="truncate text-base font-black text-slate-900">
                          {point.libelle || '-'}
                        </p>

                        {point.description && (
                          <p className="mt-1 truncate text-sm font-medium text-slate-500">
                            {point.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <TypeBadge typePoint={point.typePoint} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge actif={Boolean(point.actif)} />
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-50 px-3 text-sm font-black text-blue-700">
                          {point.nbMateriels ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <ActionLink
                            title="Voir"
                            href={`/points-structure/${point.idPoint}`}
                          >
                            <Eye size={17} />
                          </ActionLink>

                          <ActionLink
                            title="Modifier"
                            href={`/points-structure/${point.idPoint}/modifier`}
                          >
                            <Pencil size={17} />
                          </ActionLink>

                          <button
                            type="button"
                            title={point.actif ? 'Désactiver' : 'Restaurer'}
                            onClick={() => handleDeleteOrRestore(point)}
                            className={`rounded-xl border p-2 transition ${
                              point.actif
                                ? 'border-red-100 text-red-600 hover:bg-red-50'
                                : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {point.actif ? (
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
  tone: 'blue' | 'emerald' | 'orange' | 'violet';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
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

function TypeBadge({
  typePoint,
}: {
  typePoint: 'GEOGRAPHIQUE' | 'TECHNIQUE';
}) {
  if (typePoint === 'GEOGRAPHIQUE') {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
        Géographique
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
      Technique
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