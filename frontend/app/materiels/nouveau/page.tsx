'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';

import MaterielForm from '@/features/materiels/components/MaterielForm';

import {
  createMateriel,
  getEtatsMateriel,
  getMateriels,
  getModeles,
  getPointsStructure,
  getTypesMateriel,
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

export default function NouveauMaterielPage() {
  const router = useRouter();

  const [modeles, setModeles] = useState<Modele[]>([]);
  const [etats, setEtats] = useState<EtatMateriel[]>([]);
  const [typesMateriel, setTypesMateriel] = useState<TypeMateriel[]>([]);
  const [pointsStructure, setPointsStructure] = useState<PointStructure[]>([]);
  const [materielsParents, setMaterielsParents] = useState<Materiel[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadReferentiels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        modelesData,
        etatsData,
        typesData,
        pointsData,
        materielsData,
      ] = await Promise.all([
        getModeles(),
        getEtatsMateriel(),
        getTypesMateriel(),
        getPointsStructure(),
        getMateriels(),
      ]);

      setModeles(modelesData);
      setEtats(etatsData);
      setTypesMateriel(typesData);
      setPointsStructure(pointsData);
      setMaterielsParents(
        materielsData.filter((materiel) => materiel.actif !== false),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des référentiels.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferentiels();
  }, [loadReferentiels]);

  async function handleSubmit(data: CreateMaterielDto | UpdateMaterielDto) {
    try {
      setSubmitting(true);
      setError('');

      const created = await createMateriel(data as CreateMaterielDto);

      router.push(`/materiels/${created.idMateriel}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du matériel.',
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        ) : (
          <MaterielForm
            mode="create"
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