'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { DemandeInterventionForm } from '@/features/demandes-intervention/components/DemandeInterventionForm';
import { createDemandeIntervention } from '@/features/demandes-intervention/services/demande-intervention.service';
import type { CreateDemandeInterventionDto } from '@/features/demandes-intervention/types/demande-intervention.types';

import { getMateriels } from '@/features/materiels/services/materiel.service';
import type { Materiel } from '@/features/materiels/types/materiel';

export default function NouvelleDemandeInterventionPage() {
  const router = useRouter();

  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loadingMateriels, setLoadingMateriels] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadMateriels = useCallback(async () => {
    try {
      setLoadingMateriels(true);
      setError('');

      const data = await getMateriels();
      setMateriels(data);
    } catch {
      setError(
        'Impossible de charger la liste des matériels. Vous pouvez quand même créer une demande sans matériel.',
      );
    } finally {
      setLoadingMateriels(false);
    }
  }, []);

  useEffect(() => {
    loadMateriels();
  }, [loadMateriels]);

  async function handleCreate(data: CreateDemandeInterventionDto) {
    try {
      setSubmitting(true);
      setError('');

      const created = await createDemandeIntervention(data);

      router.push(`/maintenance/demandes/${created.idDemande}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de créer la demande d’intervention.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1250px]">
        {loadingMateriels ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Chargement du formulaire...
          </div>
        ) : (
          <DemandeInterventionForm
            materiels={materiels}
            submitting={submitting}
            error={error}
            submitLabel="Enregistrer"
            onSubmit={handleCreate}
          />
        )}
      </section>
    </main>
  );
}