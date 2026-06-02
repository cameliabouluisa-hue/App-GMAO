'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

import FamilleDetailCard from '@/features/familles/components/famille-detail-card';
import { useFamilleDetail } from '@/features/familles/hooks/useFamilleDetail';

export default function DetailFamillePage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const rawId = params.id;
    return Number(Array.isArray(rawId) ? rawId[0] : rawId);
  }, [params.id]);

  const {
    famille,
    parentFamille,
    loading,
    deleting,
    error,
    handleDelete,
  } = useFamilleDetail({
    familleId: id,
    onDeleteSuccess: () => router.push('/familles'),
  });

  function handleBack() {
    router.push('/familles');
  }

  function handleEdit() {
    router.push(`/familles/${id}/modifier`);
  }

  function handleRefresh() {
    window.location.reload();
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <div className="mx-auto flex min-h-[420px] max-w-[1180px] items-center justify-center">
          <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-[#06475a]" size={32} />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Chargement de la famille...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !famille) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <section className="mx-auto max-w-[1180px]">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="rounded-[24px] border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-950">
                  Famille introuvable
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {error || 'Impossible de charger les informations de cette famille.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
      <FamilleDetailCard
        famille={famille}
        parentFamille={parentFamille}
        deleting={deleting}
        onBack={handleBack}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
      />
    </main>
  );
}