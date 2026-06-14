

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react';

import type { DemandeIntervention } from '../types/demande-intervention.types';

type Props = {
  demandes: DemandeIntervention[];
  total: number;
  loading?: boolean;
  actionLoadingId?: number | null;
  
  onDelete?: (demande: DemandeIntervention) => void;
  getDetailHref?: (demande: DemandeIntervention) => string;
  getEditHref?: (demande: DemandeIntervention) => string;
};

export function DemandeInterventionTable({
  demandes,
  total,
  loading = false,
  actionLoadingId = null,
  onDelete,
  getDetailHref = (demande) =>
    `/maintenance/demandes/${demande.idDemande}`,
  getEditHref,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Liste des demandes d’intervention
          </h2>

          <p className="text-sm font-medium text-slate-500">
            {demandes.length} demande(s) affichée(s) sur {total}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm font-bold text-slate-500">
          Chargement des demandes d’intervention...
        </div>
      ) : demandes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Matériel</th>
                <th className="px-5 py-4">Priorité</th>
                <th className="px-5 py-4">Criticité</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Date demande</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {demandes.map((demande) => {
                const isActionLoading =
                  actionLoadingId === demande.idDemande;

                return (
                  <tr
                    key={demande.idDemande}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 align-middle">
                      <Link
                        href={getDetailHref(demande)}
                        className="text-sm font-black text-slate-950 hover:text-[#0b3d4f]"
                      >
                        {getDemandeCodeLabel(
                          demande.code,
                          demande.idDemande,
                        )}
                      </Link>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <p className="max-w-[330px] break-words text-sm font-bold leading-6 text-slate-800">
                        {demande.description || '—'}
                      </p>

                      {demande.demandeur && (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          Demandeur : {demande.demandeur}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <p className="max-w-[260px] break-words text-sm font-bold text-slate-800">
                        {formatMateriel(demande)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <PrioriteBadge priorite={demande.priorite} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <CriticiteBadge criticite={demande.criticite} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <StatutBadge statut={demande.statut} />
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <p className="text-sm font-bold text-slate-700">
                        {formatDateTime(
                          demande.dateDemande || demande.createdAt,
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          href={getDetailHref(demande)}
                          icon={<Eye size={16} />}
                          label="Voir"
                        />

                        {getEditHref && (
                          <ActionButton
                            href={getEditHref(demande)}
                            icon={<Pencil size={16} />}
                            label="Modifier"
                          />
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => onDelete(demande)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatutBadge({ statut }: { statut?: string | null }) {
  const label = formatStatut(statut);

 const className =
  statut === 'EN_PREPARATION'
    ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
    : statut === 'ATTENTE_PRISE_EN_COMPTE'
      ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
      : statut === 'ATTENTE_REALISATION'
        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
        : statut === 'TERMINE' || statut === 'SOLDE'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : statut === 'REFUSE' || statut === 'ANNULE'
            ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
    >
      {label}
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
      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
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
      className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${className}`}
    >
      {formatCriticite(criticite)}
    </span>
  );
}

function ActionButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#0b3d4f]"
    >
      {icon}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText size={24} />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        Aucune demande trouvée
      </h3>

      <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
        Modifiez les filtres ou créez une nouvelle demande d’intervention pour
        signaler un besoin de maintenance.
      </p>

      <Link
        href="/maintenance/demandes/nouveau"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b3d4f] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082f3d]"
      >
        Nouvelle demande
      </Link>
    </div>
  );
}

function formatStatut(statut?: string | null) {
  switch (statut) {
    case 'EN_PREPARATION':
      return 'En préparation';
    case 'ATTENTE_PRISE_EN_COMPTE':
      return 'Attente prise en compte';
    case 'ATTENTE_REALISATION':
      return 'Attente réalisation';
    case 'TERMINE':
      return 'Terminé';
    case 'REFUSE':
      return 'Refusé';
    case 'SOLDE':
      return 'Soldé';
    case 'ANNULE':
      return 'Annulé';
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

  return `Matériel #${demande.idMateriel}`;
}

function getDemandeCodeLabel(code?: string | null, idDemande?: number) {
  if (code) return code;
  if (idDemande) return `DI-${String(idDemande).padStart(4, '0')}`;
  return 'DI';
}