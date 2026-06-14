'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { DemandeInterventionForm } from '@/features/demandes-intervention/components/DemandeInterventionForm';

import {
  getDemandeIntervention,
  updateDemandeIntervention,
} from '@/features/demandes-intervention/services/demande-intervention.service';

import type {
  CreateDemandeInterventionDto,
  DemandeIntervention,
} from '@/features/demandes-intervention/types/demande-intervention.types';

import { getMateriels } from '@/features/materiels/services/materiel.service';
import type { Materiel } from '@/features/materiels/types/materiel';

export default function ModifierDemandeInterventionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idDemande = Number(params.id);

  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!Number.isFinite(idDemande)) {
      setError('Identifiant de demande invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [demandeData, materielsData] = await Promise.all([
        getDemandeIntervention(idDemande),
        getMateriels(),
      ]);

      setDemande(demandeData);
      setMateriels(materielsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement de la demande.',
      );
    } finally {
      setLoading(false);
    }
  }, [idDemande]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpdate(data: CreateDemandeInterventionDto) {
    try {
      setSubmitting(true);
      setError('');

      const updated = await updateDemandeIntervention(idDemande, data);

      router.push(`/maintenance/demandes/${updated.idDemande}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier la demande d’intervention.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1250px]">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Chargement de la demande...
          </div>
        ) : error && !demande ? (
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-7 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />

              <div>
                <p className="text-base font-black">
                  Impossible de charger la demande
                </p>

                <p className="mt-1 text-sm font-bold">{error}</p>

                <Link
                  href="/maintenance/demandes"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <ArrowLeft size={18} />
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>
        ) : demande ? (
          <DemandeInterventionForm
            materiels={materiels}
            initialData={demande}
            submitting={submitting}
            error={error}
            submitLabel="Enregistrer les modifications"
            eyebrow="Modification demande"
            title={`Modifier ${demande.code || `DI-${demande.idDemande}`}`}
            subtitle="Mettez à jour les informations générales de la demande d’intervention."
            cancelHref={`/maintenance/demandes/${demande.idDemande}`}
            onSubmit={handleUpdate}
          />
        ) : null}
      </section>
    </main>
  );
}