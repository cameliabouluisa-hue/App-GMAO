'use client';

import { Select } from '@/components/select';
import { deleteModele } from '@/features/modeles/services/modele.service';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import {
  Eye,
  FolderTree,
  GitBranch,
  Layers3,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Shapes,
  Trash2,
} from 'lucide-react';

import {
  FamilleTable,
  useFamilles,
} from '@/features/familles';

import type { FamilleFilterType } from '@/features/familles/types/famille';

export default function FamillesPage() {
  const router = useRouter();

  const {
    loading,
    error,
    search,
    setSearch,
    filterType,
    setFilterType,
    expanded,
    showModeles,
    famillesMap,
    visibleRows,
    toggleRow,
    toggleModeles,
    handleDeleteFamille,
  } = useFamilles();

  const familles = Array.from(famillesMap.values());

  const stats = {
    total: famillesMap.size,
    affichees: visibleRows.length,
    modeles: familles.filter((f) => (f.modele?.length || 0) > 0).length,
    sousFamilles: familles.filter((f) => f.parent_id !== null).length,
  };

  function handleCreateFamille() {
    router.push('/familles/nouvelle');
  }

  function handleViewFamille(idFamille: number) {
    router.push(`/familles/${idFamille}`);
  }

  function handleEditFamille(idFamille: number) {
    router.push(`/familles/${idFamille}/modifier`);
  }

  function handleViewModele(modeleId: number) {
    router.push(`/modeles/${modeleId}`);
  }

  function handleEditModele(modeleId: number) {
    router.push(`/modeles/${modeleId}/modifier`);
  }

  async function handleDeleteModele(modeleId: number) {
    const confirmed = window.confirm('Voulez-vous vraiment supprimer ce modèle ?');
    if (!confirmed) return;

    try {
      await deleteModele(modeleId);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
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
              Familles
            </h1>

            <p className="mt-1 text-base text-slate-500">
              Créez, consultez et gérez les familles, sous-familles et modèles associés.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={handleCreateFamille}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
            >
              <Plus size={18} />
              Nouvelle famille
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MiniStat icon={<FolderTree size={18} />} label="Total" value={stats.total} tone="blue" />
          <MiniStat icon={<GitBranch size={18} />} label="Affichées" value={stats.affichees} tone="emerald" />
          <MiniStat icon={<Layers3 size={18} />} label="Modèles" value={stats.modeles} tone="orange" />
          <MiniStat icon={<Shapes size={18} />} label="Sous-fam." value={stats.sousFamilles} tone="violet" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code ou libellé..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#0b3d4f] focus:bg-white"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value: string) =>
                setFilterType(value as FamilleFilterType)
              }
              items={[
                { label: 'Toutes les familles', value: 'all' },
                { label: 'Familles parentes', value: 'parents' },
                { label: 'Avec modèles', value: 'withModels' },
              ]}
            />

           
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
        Liste des familles
      </h2>

      <p className="mt-1 text-sm font-medium text-slate-500">
        {visibleRows.length} famille(s) affichée(s)
      </p>
    </div>
  </div>

  {loading ? (
    <div className="p-8 text-center text-base font-semibold text-slate-500">
      Chargement des familles...
    </div>
  ) : visibleRows.length === 0 ? (
    <div className="p-8 text-center">
      <p className="text-base font-bold text-slate-700">
        Aucune famille trouvée.
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Créez une nouvelle famille ou modifiez vos filtres.
      </p>
    </div>
  ) : (
    <FamilleTable
      visibleRows={visibleRows}
      famillesMap={famillesMap}
      expanded={expanded}
      showModeles={showModeles}
      onToggleRow={toggleRow}
      onToggleModeles={toggleModeles}
      onViewFamille={handleViewFamille}
      onEditFamille={handleEditFamille}
      onDeleteFamille={handleDeleteFamille}
      onViewModele={handleViewModele}
      onEditModele={handleEditModele}
      onDeleteModele={handleDeleteModele}
    />
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