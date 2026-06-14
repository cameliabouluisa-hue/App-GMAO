

import {
  AppBadge,
  AppFieldGrid,
  AppReadField,
  AppSection,
  appPrimaryButtonClassName,
  appSecondaryButtonClassName,
} from '@/components/app-section-layout';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCcw,
  Send,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { DemandeIntervention } from '../types/demande-intervention.types';

type Props = {
  demande: DemandeIntervention;
  actionLoading?: boolean;
  onRefresh: () => void;
  onSoumettre: () => void;
  onAccepter: () => void;
  onRefuser: () => void;
  onAccepterTravaux: () => void;
  onRefuserTravaux: () => void;
};

export function DemandeInterventionDetail({
  demande,
  actionLoading = false,
  onRefresh,
  onSoumettre,
  onAccepter,
  onRefuser,
  onAccepterTravaux,
  onRefuserTravaux,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 bg-[#07576b] px-7 py-6 text-white md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <FileText size={28} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-white/60">
              Demande d’intervention
            </p>

            <h1 className="mt-1 text-3xl font-black">
              {getDemandeCodeLabel(demande.code, demande.idDemande)}
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/80">
              {demande.description || 'Aucune description renseignée.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatutBadge statut={demande.statut} variant="header" />
              <PrioriteBadge priorite={demande.priorite} />
              <CriticiteBadge criticite={demande.criticite} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/maintenance/demandes"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 text-sm font-black text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 text-sm font-black text-white transition hover:bg-white/20"
          >
            <RefreshCcw size={18} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="space-y-6 px-7 py-6">
        <WorkflowActions
          statut={demande.statut}
          actionLoading={actionLoading}
          onSoumettre={onSoumettre}
          onAccepter={onAccepter}
          onRefuser={onRefuser}
          onAccepterTravaux={onAccepterTravaux}
          onRefuserTravaux={onRefuserTravaux}
        />

        <AppSection title="Informations générales">
          <AppFieldGrid>
            <AppReadField
              label="Identifiant"
              value={demande.idDemande}
            />

            <AppReadField
              label="Code"
              value={getDemandeCodeLabel(demande.code, demande.idDemande)}
            />

            <AppReadField
              label="Statut"
              value={<StatutBadge statut={demande.statut} />}
            />

            <AppReadField
              label="Date demande"
              value={formatDateTime(demande.dateDemande)}
            />

            <AppReadField
              label="Demandeur"
              value={demande.demandeur}
            />

            <AppReadField
              label="Créé par"
              value={demande.createdBy}
            />

            <AppReadField
              label="Priorité"
              value={<PrioriteBadge priorite={demande.priorite} />}
            />

            <AppReadField
              label="Criticité"
              value={<CriticiteBadge criticite={demande.criticite} />}
            />
          </AppFieldGrid>

          <AppReadField
            label="Description"
            value={demande.description}
          />
        </AppSection>

        <AppSection title="Matériel concerné">
          <AppFieldGrid>
            <AppReadField
              label="Matériel"
              value={formatMateriel(demande)}
            />

            <AppReadField
              label="ID matériel"
              value={demande.idMateriel}
            />

            <AppReadField
              label="Matériel en panne"
              value={<BooleanBadge value={demande.materielEnPanne} />}
            />

            <AppReadField
              label="Matériel indisponible"
              value={<BooleanBadge value={demande.materielIndisponible} />}
            />

            <AppReadField
              label="Réception travaux"
              value={<BooleanBadge value={demande.receptionTravaux} />}
            />
          </AppFieldGrid>
        </AppSection>

        <AppSection title="Workflow de la demande">
          <AppFieldGrid>
            <AppReadField
              label="Date soumission"
              value={formatDateTime(demande.dateSoumission)}
            />

            <AppReadField
              label="Date validation"
              value={formatDateTime(demande.dateValidation)}
            />

            <AppReadField
              label="Validée par"
              value={demande.validatedBy}
            />

            <AppReadField
              label="Motif refus"
              value={demande.motifRefus}
            />
          </AppFieldGrid>
        </AppSection>

        <AppSection title="Réception des travaux">
          <AppFieldGrid>
            <AppReadField
              label="Date réception"
              value={formatDateTime(demande.dateReceptionTravaux)}
            />

            <AppReadField
              label="Réception par"
              value={demande.receptionBy}
            />

            <AppReadField
              label="Motif refus travaux"
              value={demande.motifRefusTravaux}
            />
          </AppFieldGrid>
        </AppSection>

        <AppSection title="Intervention générée">
          {demande.intervention && demande.intervention.length > 0 ? (
            <div className="space-y-3">
              {demande.intervention.map((intervention) => (
                <div
                  key={intervention.idIntervention}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {intervention.code ||
                        `OT-${intervention.idIntervention}`}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {intervention.libelle || 'Intervention générée'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                      {intervention.typeMaintenance || '—'}
                    </span>

                    <span className="inline-flex rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                      {intervention.etat || '—'}
                    </span>

                    <Link
                      href={`/maintenance/interventions/${intervention.idIntervention}`}
                      className={appSecondaryButtonClassName}
                    >
                      Voir OT
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">
              Aucune intervention n’est encore liée à cette demande.
            </div>
          )}
        </AppSection>

        <AppSection title="Historique des états">
          {demande.historiquesEtat && demande.historiquesEtat.length > 0 ? (
            <div className="space-y-3">
              {demande.historiquesEtat.map((historique, index) => (
                <div
                  key={
                    historique.idHistorique ||
                    historique.idHistoriqueEtat ||
                    historique.idHistoriqueEtatDemande ||
                    index
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {historique.action || 'Changement d’état'}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatStatut(
                          historique.ancienStatut || historique.ancienEtat,
                        )}{' '}
                        →{' '}
                        {formatStatut(
                          historique.nouveauStatut || historique.nouvelEtat,
                        )}
                      </p>

                      {historique.commentaire && (
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          {historique.commentaire}
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm font-black text-slate-700">
                        {historique.changedBy ||
                          historique.createdBy ||
                          '—'}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {formatDateTime(
                          historique.dateChangement ||
                            historique.changedAt ||
                            historique.createdAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">
              Aucun historique disponible.
            </div>
          )}
        </AppSection>

        <AppSection title="Audit technique">
          <AppFieldGrid>
            <AppReadField
              label="Créé le"
              value={formatDateTime(demande.createdAt)}
            />

            <AppReadField
              label="Modifié le"
              value={formatDateTime(demande.updatedAt)}
            />
          </AppFieldGrid>
        </AppSection>
      </div>
    </div>
  );
}

function WorkflowActions({
  statut,
  actionLoading,
  onSoumettre,
  onAccepter,
  onRefuser,
  onAccepterTravaux,
  onRefuserTravaux,
}: {
  statut?: string | null;
  actionLoading: boolean;
  onSoumettre: () => void;
  onAccepter: () => void;
  onRefuser: () => void;
  onAccepterTravaux: () => void;
  onRefuserTravaux: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Actions workflow
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Les actions disponibles dépendent du statut actuel de la demande.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {statut === 'EN_PREPARATION' && (
  <button
    type="button"
    disabled={actionLoading}
    onClick={onSoumettre}
    className={appPrimaryButtonClassName}
  >
    <Send size={18} />
    Soumettre
  </button>
)}

{statut === 'ATTENTE_PRISE_EN_COMPTE' && (
  <>
    <button
      type="button"
      disabled={actionLoading}
      onClick={onAccepter}
      className={appPrimaryButtonClassName}
    >
      <CheckCircle2 size={18} />
      Accepter
    </button>

    <button
      type="button"
      disabled={actionLoading}
      onClick={onRefuser}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <XCircle size={18} />
      Refuser
    </button>
  </>
)}

{statut === 'TERMINE' && (
  <>
    <button
      type="button"
      disabled={actionLoading}
      onClick={onAccepterTravaux}
      className={appPrimaryButtonClassName}
    >
      <Wrench size={18} />
      Accepter travaux
    </button>

    <button
      type="button"
      disabled={actionLoading}
      onClick={onRefuserTravaux}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <XCircle size={18} />
      Refuser travaux
    </button>
  </>
)}

{statut === 'ATTENTE_REALISATION' && (
  <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700">
    <Clock3 size={18} />
    En attente de réalisation
  </div>
)}

{statut === 'REFUSE' && (
  <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 text-sm font-black text-red-700">
    <XCircle size={18} />
    Demande refusée
  </div>
)}

{statut === 'SOLDE' && (
  <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 text-sm font-black text-emerald-700">
    <ShieldCheck size={18} />
    Demande soldée
  </div>
)}

{statut === 'ANNULE' && (
  <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-black text-slate-600">
    <XCircle size={18} />
    Demande annulée
  </div>
)}
        </div>
      </div>
    </div>
  );
}

function StatutBadge({
  statut,
  variant = 'default',
}: {
  statut?: string | null;
  variant?: 'default' | 'header';
}) {
  const base =
    variant === 'header'
      ? 'bg-white/15 text-white'
      : statut === 'EN_PREPARATION'
        ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
        : statut === 'ATTENTE_PRISE_EN_COMPTE'
          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
          : statut === 'ATTENTE_REALISATION'
            ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
            : statut === 'TERMINE' || statut === 'SOLDE'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
            : statut === 'REFUSE'
              ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
              : statut === 'ANNULE'
                ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                : 'bg-orange-50 text-orange-700 ring-1 ring-orange-100';

  return (
    <span
      className={`inline-flex w-fit rounded-xl px-3 py-1.5 text-xs font-black ${base}`}
    >
      {formatStatut(statut)}
    </span>
  );
}

function PrioriteBadge({ priorite }: { priorite?: string | null }) {
  const className =
    priorite === 'BASSE'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : priorite === 'NORMALE'
        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
        : priorite === 'HAUTE'
          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
          : priorite === 'URGENTE'
            ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

  return (
    <span
      className={`inline-flex w-fit rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
    >
      {formatPriorite(priorite)}
    </span>
  );
}

function CriticiteBadge({ criticite }: { criticite?: string | null }) {
  const className =
    criticite === 'FAIBLE'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : criticite === 'MOYENNE'
        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
        : criticite === 'ELEVEE'
          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
          : criticite === 'CRITIQUE'
            ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

  return (
    <span
      className={`inline-flex w-fit rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
    >
      {formatCriticite(criticite)}
    </span>
  );
}

function BooleanBadge({ value }: { value?: boolean | null }) {
  return (
    <span
      className={`inline-flex w-fit rounded-xl px-3 py-1.5 text-xs font-black ${
        value
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      {value ? 'Oui' : 'Non'}
    </span>
  );
}

function formatStatut(statut?: string | null) {
  const labels: Record<string, string> = {
    EN_PREPARATION: 'En préparation',
    ATTENTE_PRISE_EN_COMPTE: 'Attente prise en compte',
    ATTENTE_REALISATION: 'Attente réalisation',
    TERMINE: 'Terminé',
    REFUSE: 'Refusé',
    SOLDE: 'Soldé',
    ANNULE: 'Annulé',
  };

  if (!statut) return '—';
  if (labels[statut]) return labels[statut];

  switch (statut) {
    case 'EN_PREPARATION':
      return 'En préparation';
    case 'SOUMISE':
      return 'Soumise';
    case 'ACCEPTEE':
      return 'Acceptée';
    case 'VALIDEE':
      return 'Validée';
    case 'REFUSEE':
      return 'Refusée';
    case 'TRANSFORMEE':
      return 'Transformée';
    case 'ANNULEE':
      return 'Annulée';
    case 'TRAVAUX_ACCEPTES':
      return 'Travaux acceptés';
    case 'TRAVAUX_REFUSES':
      return 'Travaux refusés';
    default:
      return statut || '—';
  }
}

function formatPriorite(priorite?: string | null) {
  switch (priorite) {
    case 'BASSE':
      return 'Basse';
    case 'NORMALE':
      return 'Normale';
    case 'HAUTE':
      return 'Haute';
    case 'URGENTE':
      return 'Urgente';
    default:
      return priorite || '—';
  }
}

function formatCriticite(criticite?: string | null) {
  switch (criticite) {
    case 'FAIBLE':
      return 'Faible';
    case 'MOYENNE':
      return 'Moyenne';
    case 'ELEVEE':
      return 'Élevée';
    case 'CRITIQUE':
      return 'Critique';
    default:
      return criticite || '—';
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatMateriel(demande: DemandeIntervention) {
  if (!demande.materiel) {
    return demande.idMateriel ? `Matériel #${demande.idMateriel}` : '—';
  }

  const code = demande.materiel.code;
  const libelle = demande.materiel.libelle;

  if (code && libelle) return `${code} — ${libelle}`;
  if (code) return code;
  if (libelle) return libelle;

  return demande.idMateriel ? `Matériel #${demande.idMateriel}` : '—';
}

function getDemandeCodeLabel(code?: string | null, idDemande?: number) {
  if (code) return code;
  if (idDemande) return `DI-${String(idDemande).padStart(4, '0')}`;
  return 'DI';
}
