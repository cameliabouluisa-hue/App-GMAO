'use client';

import { ChevronLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import FamilleForm from '@/features/familles/components/famille-form';
import { useEditFamilleForm } from '@/features/familles/hooks/useEditFamilleForm';

export default function ModifierFamillePage() {
  const router = useRouter();
  const params = useParams();

  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : String(idParam ?? '');

  const {
    values,
    familles,
    loading,
    loadingParents,
    saving,
    error,
    success,

    setCode,
    setLibelle,
    setParentId,
    setActif,
    setTypeFamille,
    setNatureAchat,

    handleSubmit,
  } = useEditFamilleForm({
    familleId: id,
    onSuccess: () => router.push(`/familles/${id}`),
  });

  const handleBack = () => {
    router.push(`/familles`);
  };

  if (loading) {
    return (
      <main className="min-h-full bg-[#F3F6FA] p-7">
        <div className="mx-auto max-w-[1500px] space-y-7">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition hover:text-slate-900"
          >
            <ChevronLeft size={20} />
            Retour
          </button>

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-72 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-5 h-5 w-96 animate-pulse rounded-2xl bg-slate-100" />
          </div>

          <div className="h-[500px] animate-pulse rounded-[28px] border border-slate-200 bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#F3F6FA] p-7">
      <div className="mx-auto max-w-[1500px] space-y-7">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeft size={20} />
          Retour
        </button>

        <FamilleForm
          title="Modifier la famille"
    
        
          submitLabel="Enregistrer"
          values={values}
          familles={familles}
          loadingParents={loadingParents}
          saving={saving}
          error={error}
          success={success}
          onCodeChange={setCode}
          onLibelleChange={setLibelle}
          onParentChange={setParentId}
          onActifChange={setActif}
          onTypeFamilleChange={setTypeFamille}
          onNatureAchatChange={setNatureAchat}
          onSubmit={handleSubmit}
          onCancel={handleBack}
        />
      </div>
    </main>
  );
}