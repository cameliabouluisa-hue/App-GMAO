'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, HardDrive, RefreshCcw } from 'lucide-react';

import MaterielDetailCard from '@/features/materiels/components/MaterielDetail';
import { getMateriel } from '@/features/materiels/services/materiel.service';
import type { Materiel } from '@/features/materiels/types/materiel';

export default function MaterielDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const rawId = params?.id;
    const value = Array.isArray(rawId) ? rawId[0] : rawId;
    return Number(value);
  }, [params]);

  const [materiel, setMateriel] = useState<Materiel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMateriel = useCallback(
    async (silent = false) => {
      if (!Number.isFinite(id) || id <= 0) {
        setError('Identifiant du matériel invalide.');
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const data = await getMateriel(id);
        setMateriel(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement du matériel.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    loadMateriel();
  }, [loadMateriel]);

  function handleEdit() {
    if (!materiel) return;

    if (materiel.actif === false) {
      setError('Ce matériel est inactif. Réactivez-le avant de le modifier.');
      return;
    }

    router.push(`/materiels/${materiel.idMateriel}/modifier`);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
      <section className="mx-auto max-w-[1180px] space-y-5">
        <BackButton onClick={() => router.back()} />

        {loading ? (
          <LoadingState />
        ) : error && !materiel ? (
          <ErrorState message={error} onRetry={() => loadMateriel()} />
        ) : materiel ? (
          <>
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
                {error}
              </div>
            )}

            <MaterielDetailCard
              materiel={materiel}
              refreshing={refreshing}
              onRefresh={() => loadMateriel(true)}
              onEdit={handleEdit}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </section>
    </main>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[#06475a]"
    >
      <ArrowLeft size={18} />
      Retour
    </button>
  );
}

function LoadingState() {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <RefreshCcw size={24} className="animate-spin" />
      </div>

      <p className="mt-4 text-sm font-black text-slate-500">
        Chargement de la fiche matériel...
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle size={24} />
      </div>

      <h2 className="mt-4 text-lg font-black text-slate-950">
        Impossible de charger le matériel
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#043747]"
      >
        <RefreshCcw size={16} />
        Réessayer
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <HardDrive size={24} />
      </div>

      <h2 className="mt-4 text-lg font-black text-slate-950">
        Matériel introuvable
      </h2>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Aucun matériel ne correspond à cet identifiant.
      </p>
    </div>
  );
}