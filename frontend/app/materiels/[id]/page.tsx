'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import MaterielDetailCard, {
  type MaterielDetail,
} from '@/features/materiels/components/MaterielDetail';

import { getMateriel } from '@/features/materiels/services/materiel.service';

export default function MaterielDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const rawId = params.id;
    return Number(Array.isArray(rawId) ? rawId[0] : rawId);
  }, [params.id]);

  const [materiel, setMateriel] = useState<MaterielDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMateriel = useCallback(
    async (isRefresh = false) => {
      if (Number.isNaN(id) || id <= 0) {
        setError('Identifiant du matériel invalide.');
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const data = await getMateriel(id);
        setMateriel(data as MaterielDetail);
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

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <div className="mx-auto flex min-h-[420px] max-w-[1180px] items-center justify-center">
          <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-[#06475a]" size={32} />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Chargement du matériel...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !materiel) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <section className="mx-auto max-w-[1180px]">
          <BackButton onClick={() => router.back()} />

          <div className="rounded-[24px] border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-950">
                  Matériel introuvable
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {error ||
                    'Impossible de charger les informations de ce matériel.'}
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/materiels')}
                  className="mt-4 rounded-2xl bg-[#06475a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#043747]"
                >
                  Retour aux matériels
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
      <section className="mx-auto max-w-[1180px]">
        <BackButton onClick={() => router.back()} />

        <MaterielDetailCard
          materiel={materiel}
          refreshing={refreshing}
          onRefresh={() => loadMateriel(true)}
          onEdit={() => router.push(`/materiels/${materiel.idMateriel}/modifier`)}
        />
      </section>
    </main>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
    >
      <ArrowLeft size={18} />
      Retour
    </button>
  );
}