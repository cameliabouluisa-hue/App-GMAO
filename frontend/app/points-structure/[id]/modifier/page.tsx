'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';

import { PointStructureFormPage } from '@/features/points-structure/components/PointStructureFormPage';
import {
  getPointStructure,
  updatePointStructure,
} from '@/features/points-structure/services/point-structure.service';
import {
  CreatePointStructureDto,
  PointStructureDetail,
  UpdatePointStructureDto,
} from '@/features/points-structure/types/point-structure.type';

export default function ModifierPointStructurePage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const rawId = params.id;

    if (Array.isArray(rawId)) {
      return Number(rawId[0]);
    }

    return Number(rawId);
  }, [params.id]);

  const [point, setPoint] = useState<PointStructureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPoint = useCallback(async () => {
    if (Number.isNaN(id) || id <= 0) {
      setError('Identifiant du point de structure invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getPointStructure(id);
      setPoint(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement du point de structure.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPoint();
  }, [loadPoint]);

  const handleSubmit = async (
    data: CreatePointStructureDto | UpdatePointStructureDto,
  ): Promise<void> => {
    await updatePointStructure(id, data as UpdatePointStructureDto);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-6 py-6">
        <section className="mx-auto flex min-h-[520px] max-w-[1180px] items-center justify-center">
          <div className="rounded-[28px] border border-slate-200 bg-white px-10 py-9 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b3d4f]/10 text-[#0b3d4f]">
              <Loader2 size={28} className="animate-spin" />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              Chargement du point
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Récupération des informations du point de structure...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !point) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-6 py-6">
        <section className="mx-auto max-w-[1180px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={28} />
              </div>

              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">
                  Erreur
                </p>

                <h1 className="mt-2 text-2xl font-black text-slate-950">
                  Point de structure introuvable
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {error ||
                    'Impossible de charger les informations de ce point de structure.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/points-structure')}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Retour à la liste
                  </button>

                  <button
                    type="button"
                    onClick={loadPoint}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-black text-white transition hover:bg-[#082f3d]"
                  >
                    <RefreshCcw size={17} />
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PointStructureFormPage
      mode="edit"
     initialData={point as never}
      onSubmit={handleSubmit}
    />
  );
}