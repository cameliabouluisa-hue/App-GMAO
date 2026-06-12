'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';

import MaterielForm from '@/features/materiels/components/MaterielForm';

import {
  getEtatsMateriel,
  getMateriel,
  getMateriels,
  getModeles,
  getPointsStructure,
  getTypesMateriel,
  updateMateriel,
} from '@/features/materiels/services/materiel.service';

import type {
  CreateMaterielDto,
  EtatMateriel,
  Materiel,
  Modele,
  PointStructure,
  TypeMateriel,
  UpdateMaterielDto,
} from '@/features/materiels/types/materiel';

export default function ModifierMaterielPage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const rawId = params?.id;
    const value = Array.isArray(rawId) ? rawId[0] : rawId;
    return Number(value);
  }, [params]);

  const [materiel, setMateriel] = useState<Materiel | null>(null);

  const [modeles, setModeles] = useState<Modele[]>([]);
  const [etats, setEtats] = useState<EtatMateriel[]>([]);
  const [typesMateriel, setTypesMateriel] = useState<TypeMateriel[]>([]);
  const [pointsStructure, setPointsStructure] = useState<PointStructure[]>([]);
  const [materielsParents, setMaterielsParents] = useState<Materiel[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Identifiant du matériel invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [
        materielData,
        modelesData,
        etatsData,
        typesData,
        pointsData,
        materielsData,
      ] = await Promise.all([
        getMateriel(id),
        getModeles(),
        getEtatsMateriel(),
        getTypesMateriel(),
        getPointsStructure(),
        getMateriels(),
      ]);

      setMateriel(materielData);
      setModeles(modelesData);
      setEtats(etatsData);
      setTypesMateriel(typesData);
      setPointsStructure(pointsData);
      setMaterielsParents(
        materielsData.filter(
          (item) =>
            item.actif !== false && item.idMateriel !== materielData.idMateriel,
        ),
      );

      if (materielData.actif === false) {
        setError(
          'Ce matériel est inactif. Réactivez-le avant de le modifier.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement du matériel.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(data: CreateMaterielDto | UpdateMaterielDto) {
    if (!materiel) return;

    if (materiel.actif === false) {
      setError('Ce matériel est inactif. Réactivez-le avant de le modifier.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const updated = await updateMateriel(
        materiel.idMateriel,
        data as UpdateMaterielDto,
      );

      router.push(`/materiels/${updated.idMateriel}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la modification du matériel.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isInactive = materiel?.actif === false;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
      <section className="mx-auto max-w-[1180px] space-y-5">
        <BackButton onClick={() => router.back()} />

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : !materiel ? (
          <ErrorState message="Matériel introuvable." onRetry={loadData} />
        ) : isInactive ? (
          <InactiveState
            code={materiel.code || `MAT-${materiel.idMateriel}`}
            onBack={() => router.push(`/materiels/${materiel.idMateriel}`)}
          />
        ) : (
          <MaterielForm
            mode="edit"
            materiel={materiel}
            modeles={modeles}
            etats={etats}
            typesMateriel={typesMateriel}
            pointsStructure={pointsStructure}
            materielsParents={materielsParents}
            loading={loading}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
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
        Chargement du formulaire matériel...
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

function InactiveState({
  code,
  onBack,
}: {
  code: string;
  onBack: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <AlertTriangle size={24} />
      </div>

      <h2 className="mt-4 text-lg font-black text-slate-950">
        Matériel inactif
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
        Le matériel {code} est inactif. Il doit être réactivé avant toute
        modification.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#043747]"
      >
        Retour à la fiche
      </button>
    </div>
  );
}