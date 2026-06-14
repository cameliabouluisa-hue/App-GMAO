'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { DemandeInterventionDetail } from '@/features/demandes-intervention/components/DemandeInterventionDetail';

import {
  accepterDemandeIntervention,
  accepterTravauxDemandeIntervention,
  getDemandeIntervention,
  refuserDemandeIntervention,
  refuserTravauxDemandeIntervention,
  soumettreDemandeIntervention,
} from '@/features/demandes-intervention/services/demande-intervention.service';

import type { DemandeIntervention } from '@/features/demandes-intervention/types/demande-intervention.types';

export default function DemandeInterventionDetailPage() {
  const params = useParams<{ id: string }>();
  const idDemande = Number(params.id);

  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDemande = useCallback(async () => {
    if (!Number.isFinite(idDemande)) {
      setError('Identifiant de demande invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getDemandeIntervention(idDemande);
      setDemande(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement de la demande d’intervention.',
      );
    } finally {
      setLoading(false);
    }
  }, [idDemande]);

  useEffect(() => {
    loadDemande();
  }, [loadDemande]);

  async function runAction(action: () => Promise<DemandeIntervention>) {
    try {
      setActionLoading(true);
      setError('');

      const updated = await action();
      setDemande(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Action impossible sur cette demande d’intervention.',
      );
    } finally {
      setActionLoading(false);
    }
  }
function handleSoumettre() {
  runAction(() =>
    soumettreDemandeIntervention(idDemande, {
      utilisateur: 'Admin',
      commentaire: 'Demande soumise',
    }),
  );
}

function handleAccepter() {
  runAction(() =>
    accepterDemandeIntervention(idDemande, {
      utilisateur: 'Admin',
      commentaire: 'Demande acceptée',
    }),
  );
}

function handleRefuser() {
  runAction(() =>
    refuserDemandeIntervention(idDemande, {
      utilisateur: 'Admin',
      motifRefus: 'Demande refusée',
    }),
  );
}

function handleAccepterTravaux() {
  runAction(() =>
    accepterTravauxDemandeIntervention(idDemande, {
      utilisateur: 'Admin',
      commentaire: 'Travaux acceptés',
    }),
  );
}

function handleRefuserTravaux() {
  runAction(() =>
    refuserTravauxDemandeIntervention(idDemande, {
      utilisateur: 'Admin',
      motifRefusTravaux: 'Travaux refusés',
    }),
  );
}

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <section className="mx-auto max-w-[1250px] space-y-5">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Chargement de la demande d’intervention...
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
          <>
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DemandeInterventionDetail
              demande={demande}
              actionLoading={actionLoading}
              onRefresh={loadDemande}
              onSoumettre={handleSoumettre}
              onAccepter={handleAccepter}
              onRefuser={handleRefuser}
              onAccepterTravaux={handleAccepterTravaux}
              onRefuserTravaux={handleRefuserTravaux}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}