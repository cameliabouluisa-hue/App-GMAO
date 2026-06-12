'use client';

import { Select } from '@/components/select';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Eye,
  HardDrive,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';

import {
  deleteMateriel,
  getMateriels,
  restoreMateriel,
} from '@/features/materiels/services/materiel.service';

import type { Materiel } from '@/features/materiels/types/materiel';

type ActifFilter = 'all' | 'true' | 'false';
type StockFilter = 'TOUS' | 'GERE_STOCK' | 'NON_GERE_STOCK';
type PositionFilter =
  | 'TOUTES'
  | 'EN_STOCK'
  | 'SUR_TERRAIN'
  | 'EN_ATELIER'
  | 'AU_REBUT';

const POSITION_OPTIONS: Array<{ label: string; value: PositionFilter }> = [
  { label: 'Toutes les positions', value: 'TOUTES' },
  { label: 'En stock', value: 'EN_STOCK' },
  { label: 'Sur terrain', value: 'SUR_TERRAIN' },
  { label: 'En atelier', value: 'EN_ATELIER' },
  { label: 'Au rebut', value: 'AU_REBUT' },
];

function isMaterielActif(materiel: Materiel) {
  return materiel.actif !== false;
}

export default function MaterielsPage() {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('TOUS');
  const [positionFilter, setPositionFilter] =
    useState<PositionFilter>('TOUTES');
  const [actif, setActif] = useState<ActifFilter>('all');

  const loadMateriels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getMateriels();
      setMateriels(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des matériels.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMateriels();
  }, [loadMateriels]);

  const filteredMateriels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return materiels.filter((materiel) => {
      const matchesSearch = [
        materiel.code,
        materiel.libelle,
        materiel.numeroSerie,
        materiel.modele?.libelle,
        materiel.modele?.code,
        materiel.type_materiel?.libelle,
        materiel.etat_materiel?.libelle,
        materiel.etat_materiel?.code,
        materiel.point_structure?.libelle,
        materiel.point_structure?.code,
        materiel.positionActuelle,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );

      const matchesStock =
        stockFilter === 'TOUS' ||
        (stockFilter === 'GERE_STOCK' && materiel.gereEnStock) ||
        (stockFilter === 'NON_GERE_STOCK' && !materiel.gereEnStock);

      const matchesPosition =
        positionFilter === 'TOUTES' ||
        materiel.positionActuelle === positionFilter;

      const materielActif = isMaterielActif(materiel);

      const matchesActif =
        actif === 'all' ||
        (actif === 'true' && materielActif) ||
        (actif === 'false' && !materielActif);

      return matchesSearch && matchesStock && matchesPosition && matchesActif;
    });
  }, [materiels, search, stockFilter, positionFilter, actif]);

  const stats = useMemo(() => {
    return {
      total: materiels.length,
      actifs: materiels.filter(isMaterielActif).length,
      stock: materiels.filter((materiel) => materiel.gereEnStock).length,
      terrain: materiels.filter(
        (materiel) => materiel.positionActuelle === 'SUR_TERRAIN',
      ).length,
      panne: materiels.filter(
        (materiel) => materiel.etat_materiel?.code === 'EN_PANNE',
      ).length,
    };
  }, [materiels]);

  function resetFilters() {
    setSearch('');
    setStockFilter('TOUS');
    setPositionFilter('TOUTES');
    setActif('all');
  }

  async function handleDeactivate(materiel: Materiel) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment désactiver le matériel ${
        materiel.code || materiel.idMateriel
      } ?`,
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(materiel.idMateriel);
      setError('');

      await deleteMateriel(materiel.idMateriel);
      await loadMateriels();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de désactiver ce matériel.',
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRestore(materiel: Materiel) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment réactiver le matériel ${
        materiel.code || materiel.idMateriel
      } ?`,
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(materiel.idMateriel);
      setError('');

      await restoreMateriel(materiel.idMateriel);
      await loadMateriels();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de réactiver ce matériel.',
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1450px] space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
              Module équipements
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-950">
              Matériels
            </h1>

            <p className="mt-1 text-base text-slate-500">
              Consultez, filtrez et gérez les équipements réels, leur état, leur
              modèle et leur affectation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadMateriels}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={18}
                className={loading ? 'animate-spin' : ''}
              />
              Actualiser
            </button>

            <Link
              href="/materiels/nouveau"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
            >
              <Plus size={18} />
              Nouveau matériel
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <MiniStat
            icon={<HardDrive size={18} />}
            label="Total"
            value={stats.total}
            tone="blue"
          />

          <MiniStat
            icon={<CheckCircle2 size={18} />}
            label="Actifs"
            value={stats.actifs}
            tone="green"
          />

          <MiniStat
            icon={<Package size={18} />}
            label="Gérés en stock"
            value={stats.stock}
            tone="emerald"
          />

          <MiniStat
            icon={<MapPin size={18} />}
            label="Sur terrain"
            value={stats.terrain}
            tone="orange"
          />

          <MiniStat
            icon={<Wrench size={18} />}
            label="En panne"
            value={stats.panne}
            tone="red"
          />
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_auto]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par code, libellé, série, modèle, état, localisation..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0b3d4f] focus:bg-white focus:ring-4 focus:ring-[#0b3d4f]/10"
              />
            </div>

            <Select
              value={stockFilter}
              onValueChange={(value: string) =>
                setStockFilter(value as StockFilter)
              }
              items={[
                { label: 'Tous les matériels', value: 'TOUS' },
                { label: 'Gérés en stock', value: 'GERE_STOCK' },
                { label: 'Non gérés en stock', value: 'NON_GERE_STOCK' },
              ]}
            />

            <Select
              value={positionFilter}
              onValueChange={(value: string) =>
                setPositionFilter(value as PositionFilter)
              }
              items={POSITION_OPTIONS}
            />

            <Select
              value={actif}
              onValueChange={(value: string) =>
                setActif(value as ActifFilter)
              }
              items={[
                { label: 'Actifs et inactifs', value: 'all' },
                { label: 'Actifs', value: 'true' },
                { label: 'Inactifs', value: 'false' },
              ]}
            />

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Réinitialiser
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Liste des matériels
              </h2>

              <p className="text-sm font-medium text-slate-500">
                {filteredMateriels.length} matériel(s) affiché(s) sur{' '}
                {materiels.length}.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500">
              Chargement des matériels...
            </div>
          ) : filteredMateriels.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">Libellé</th>
                    <th className="px-5 py-4">Modèle</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">État</th>
                    <th className="px-5 py-4">Actif</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredMateriels.map((materiel) => {
                    const materielActif = isMaterielActif(materiel);
                    const isActionLoading =
                      actionLoadingId === materiel.idMateriel;

                    return (
                      <tr
                        key={materiel.idMateriel}
                        className={`transition hover:bg-slate-50/70 ${
                          !materielActif ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="px-5 py-4 align-middle">
                          <Link
                            href={`/materiels/${materiel.idMateriel}`}
                            className="text-sm font-black text-slate-950 hover:text-[#0b3d4f]"
                          >
                            {materiel.code || `MAT-${materiel.idMateriel}`}
                          </Link>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <p className="max-w-[260px] break-words text-sm font-bold text-slate-800">
                            {materiel.libelle || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <p className="max-w-[240px] break-words text-sm font-bold text-slate-800">
                            {materiel.modele?.libelle ||
                              materiel.modele?.code ||
                              '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <p className="text-sm font-bold text-slate-800">
                            {materiel.type_materiel?.libelle || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <EtatBadge
                            code={materiel.etat_materiel?.code}
                            label={
                              materiel.etat_materiel?.libelle ||
                              materiel.etat_materiel?.code ||
                              'Sans état'
                            }
                          />
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <ActifBadge actif={materielActif} />
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              href={`/materiels/${materiel.idMateriel}`}
                              icon={<Eye size={16} />}
                              label="Voir"
                            />

                            {materielActif && (
                              <>
                                <ActionButton
                                  href={`/materiels/${materiel.idMateriel}/modifier`}
                                  icon={<Pencil size={16} />}
                                  label="Modifier"
                                />

                                <button
                                  type="button"
                                  disabled={isActionLoading}
                                  onClick={() => handleDeactivate(materiel)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Désactiver"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}

                            {!materielActif && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleRestore(materiel)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Réactiver"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
  tone: 'blue' | 'emerald' | 'orange' | 'green' | 'red';
}) {
  const tones: Record<typeof tone, string> = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          {icon}
        </div>

        <p className="text-2xl font-black text-slate-950">{value}</p>
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function EtatBadge({
  code,
  label,
}: {
  code?: string | null;
  label: string;
}) {
  const className =
    code === 'EN_SERVICE' || code === 'VALIDE'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : code === 'EN_PANNE'
        ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
        : code === 'EN_REVISION' || code === 'EN_MAINTENANCE'
          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
          : code === 'AU_REBUT' || code === 'ANNULE'
            ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
            : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';

  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
    >
      {label}
    </span>
  );
}

function ActifBadge({ actif }: { actif: boolean }) {
  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${
        actif
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      {actif ? 'Actif' : 'Inactif'}
    </span>
  );
}

function ActionButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#0b3d4f]"
    >
      {icon}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <HardDrive size={24} />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        Aucun matériel trouvé
      </h3>

      <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
        Modifiez les filtres ou créez un nouveau matériel pour alimenter le parc
        équipements.
      </p>

      <Link
        href="/materiels/nouveau"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
      >
        <Plus size={18} />
        Nouveau matériel
      </Link>
    </div>
  );
}