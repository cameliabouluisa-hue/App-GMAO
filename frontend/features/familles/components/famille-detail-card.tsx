

import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Layers3,
  Package,
  Pencil,
  RefreshCcw,
  Tag,
  Trash2,
} from 'lucide-react';

import type {
  FamilleApi,
  NatureAchatFamille,
  TypeFamille,
} from '@/features/familles/types/famille';

type FamilleModele = {
  idModele?: number;
  id?: number;
  code?: string | null;
  libelle?: string | null;
  nom?: string | null;
  designation?: string | null;
};

type FamilleDetail = Omit<FamilleApi, 'famille' | 'other_famille' | 'modele'> & {
  famille?: FamilleApi | null;
  parent?: FamilleApi | null;
  other_famille?: FamilleApi[] | null;
  enfants?: FamilleApi[] | null;
  modele?: FamilleModele[] | null;
  modeles?: FamilleModele[] | null;
  _count?: {
    modele?: number;
    modeles?: number;
    other_famille?: number;
    enfants?: number;
  } | null;
};

type FamilleDetailCardProps = {
  famille: FamilleDetail;
  parentFamille?: FamilleApi | null;
  deleting?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onDelete?: () => void | Promise<void>;
};

export default function FamilleDetailCard({
  famille,
  parentFamille,
  deleting = false,
  onBack,
  onEdit,
  onRefresh,
  onDelete,
}: FamilleDetailCardProps) {
  const parent = parentFamille || famille.famille || famille.parent || null;

  const modeles = famille.modele || famille.modeles || [];
  const sousFamilles = famille.other_famille || famille.enfants || [];

  const parentLabel = parent
    ? formatFamilleLabel(parent)
    : famille.parent_id
      ? `Famille parente #${famille.parent_id}`
      : 'Famille racine';

  const typeLabel = formatTypeFamille(famille.typeFamille);
  const natureLabel = formatNatureAchat(famille.natureAchat);
  const actif = famille.actif !== false;

  const nombreModeles =
    modeles.length ||
    famille._count?.modele ||
    famille._count?.modeles ||
    0;

  const nombreSousFamilles =
    sousFamilles.length ||
    famille._count?.other_famille ||
    famille._count?.enfants ||
    0;

  function handleDeleteClick() {
    if (!onDelete) return;

    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer cette famille ?',
    );

    if (!confirmed) return;

    void onDelete();
  }

  return (
    <section className="mx-auto max-w-[1180px]">
      <BackButton onClick={onBack} />

      <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#06475a]">
              <GitBranch size={28} />
            </div>

            <div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {famille.libelle || 'Sans libellé'}
                </h1>

                <span
                  className={`rounded-xl px-3 py-1 text-sm font-bold ${
                    actif
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {actif ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Code : {famille.code || 'Non renseigné'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-5 text-sm font-bold text-white shadow-md shadow-[#06475a]/20 transition hover:bg-[#043747]"
            >
              <Pencil size={16} />
              Modifier
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Identification" icon={<Layers3 size={19} />}>
            <InfoGrid>
              <Info label="ID famille" value={famille.idFamille} />
              <Info label="Code" value={famille.code} />
              <Info label="Libellé" value={famille.libelle} />
              <Info label="Type" value={typeLabel} />
              <Info label="Nature d’achat" value={natureLabel} />
              <Info label="Statut" value={actif ? 'Actif' : 'Inactif'} />
            </InfoGrid>
          </Card>

          <Card title="Arborescence" icon={<GitBranch size={19} />}>
            <InfoGrid>
              <Info label="Famille parente" value={parentLabel} />
              <Info label="Sous-familles" value={nombreSousFamilles} />
            </InfoGrid>

            {sousFamilles.length > 0 ? (
              <div className="mt-4 space-y-3">
                {sousFamilles.map((item) => (
                  <div
                    key={item.idFamille}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-slate-950">
                        {item.libelle || 'Sans libellé'}
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-slate-400">
                        Code : {item.code || 'Non renseigné'}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                      Sous-famille
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <InfoBlock
                label="Sous-familles"
                value="Aucune sous-famille liée à cette famille."
              />
            )}
          </Card>

          <Card title="Modèles associés" icon={<Package size={19} />}>
            {modeles.length > 0 ? (
              <div className="space-y-3">
                {modeles.map((modele, index) => (
                  <div
                    key={getModeleKey(modele, index)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-slate-950">
                        {getModeleLibelle(modele)}
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-slate-400">
                        Code : {modele.code || 'Non renseigné'}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                      Modèle
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <InfoBlock
                label="Modèles associés"
                value="Aucun modèle associé à cette famille."
              />
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card title="Résumé" icon={<CheckCircle2 size={19} />}>
            <div className="space-y-3">
              <StatusBadge label="Type" value={typeLabel} variant="cyan" />

              <StatusBadge
                label="Statut"
                value={actif ? 'Actif' : 'Inactif'}
                variant={actif ? 'green' : 'slate'}
              />

              <StatusBadge
                label="Nature"
                value={natureLabel}
                variant={famille.natureAchat ? 'blue' : 'slate'}
              />
            </div>
          </Card>

          <Card title="Relations" icon={<GitBranch size={19} />}>
            <SideInfo label="Famille parente" value={parentLabel} />
            <SideInfo label="Nombre de modèles" value={nombreModeles} />
            <SideInfo label="Nombre de sous-familles" value={nombreSousFamilles} />
          </Card>

          {onDelete ? (
            <Card title="Gestion" icon={<Trash2 size={19} />} danger>
              <p className="mb-4 text-sm font-semibold leading-6 text-slate-500">
                Cette action permet de supprimer la famille sélectionnée.
              </p>

              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
    >
      <ArrowLeft size={18} />
      Retour
    </button>
  );
}

function Card({
  title,
  icon,
  children,
  danger = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger ? 'bg-red-50 text-red-600' : 'bg-cyan-50 text-[#06475a]'
          }`}
        >
          {icon}
        </div>

        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-8 md:grid-cols-2">{children}</div>;
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const empty = value === null || value === undefined || value === '';

  return (
    <div className="flex min-h-[48px] items-center justify-between gap-5 border-b border-slate-100 py-2">
      <span className="text-sm font-semibold text-slate-500">{label}</span>

      <span
        className={`text-right text-sm font-extrabold ${
          empty ? 'text-slate-400' : 'text-slate-950'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </span>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const empty = !value?.trim();

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p
        className={`text-sm font-medium leading-6 ${
          empty ? 'text-slate-400' : 'text-slate-700'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </p>
    </div>
  );
}

function SideInfo({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const empty = value === null || value === undefined || value === '';

  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-extrabold ${
          empty ? 'text-slate-400' : 'text-slate-950'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </p>
    </div>
  );
}

function StatusBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'blue' | 'cyan' | 'green' | 'red' | 'slate';
}) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    cyan: 'bg-cyan-50 text-[#06475a] border-cyan-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-200',
  };

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${variants[variant]}`}
    >
      <span className="text-xs font-bold uppercase tracking-[0.16em]">
        {label}
      </span>

      <span className="text-sm font-extrabold">{value}</span>
    </div>
  );
}

function formatFamilleLabel(famille?: FamilleApi | null) {
  if (!famille) return 'Non renseigné';

  const code = famille.code || 'Sans code';
  const libelle = famille.libelle || 'Sans libellé';

  return `${code} — ${libelle}`;
}

function formatTypeFamille(type?: TypeFamille | null) {
  if (type === 'EQUIPEMENT') return 'Équipement';
  if (type === 'ARTICLE') return 'Article';
  if (type === 'MIXTE') return 'Mixte';

  return 'Non renseigné';
}

function formatNatureAchat(nature?: NatureAchatFamille | null) {
  if (nature === 'ELECTRIQUE') return 'Électrique';
  if (nature === 'MECANIQUE') return 'Mécanique';
  if (nature === 'HYDRAULIQUE') return 'Hydraulique';
  if (nature === 'PNEUMATIQUE') return 'Pneumatique';
  if (nature === 'CONSOMMABLE') return 'Consommable ';

  return 'Non renseigné';
}

function getModeleKey(modele: FamilleModele, index: number) {
  return modele.idModele || modele.id || modele.code || index;
}

function getModeleLibelle(modele: FamilleModele) {
  return (
    modele.libelle ||
    modele.nom ||
    modele.designation ||
    'Modèle sans libellé'
  );
}