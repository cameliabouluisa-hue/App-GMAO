'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { FamilleForm, useFamilleForm } from '@/features/familles';

export default function NouvelleFamillePage() {
  const router = useRouter();

  const {
    values,
    familles,
    loadingParents,
    saving,
    error,
    success,

    setCode,
    setLibelle,
    setParentId,
    setEtat,
    setActif,
    setNatureAchat,
    setTypeFamille,

    handleSubmit,
  } = useFamilleForm({
    onSuccess: () => {
      router.push('/familles');
      router.refresh();
    },
  });

  function handleBack() {
    router.push('/familles');
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-6 text-slate-950">
      <div className="mx-auto max-w-[1280px] pb-24">
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour
        </button>

        <FamilleForm
          title="Nouvelle famille"
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
          onNatureAchatChange={setNatureAchat}
          onTypeFamilleChange={setTypeFamille}
          onSubmit={handleSubmit}
          onCancel={handleBack}
        />
      </div>
    </main>
  );
}