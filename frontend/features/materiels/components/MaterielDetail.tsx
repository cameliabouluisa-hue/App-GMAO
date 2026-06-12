

import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  Activity,
  CalendarClock,
  Gauge,
  HardDrive,
  Pencil,
  RefreshCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  AppBadge,
  AppFieldGrid,
  AppReadField,
  AppSection,
} from '@/components/app-section-layout';

import { genererPlanPreventifDepuisPPP } from '@/features/materiels/services/materiel.service';
import type { Materiel } from '@/features/materiels/types/materiel';

export type MaterielDetail = Materiel;

type Props = {
  materiel: MaterielDetail;
  refreshing?: boolean;
  onRefresh: () => void | Promise<void>;
  onEdit: () => void;
};

type TabId = 'general' | 'preventif' | 'mesures' | 'interventions';

const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'general', label: 'Général', icon: <HardDrive size={17} /> },
  { id: 'preventif', label: 'Préventif', icon: <CalendarClock size={17} /> },
  { id: 'mesures', label: 'Mesures', icon: <Gauge size={17} /> },
  { id: 'interventions', label: 'Interventions', icon: <Activity size={17} /> },
];

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== '';
}

function formatValue(value: string | number | boolean | null | undefined) {
  if (!hasValue(value)) return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR').format(date);
}

function getEtatLabel(materiel: MaterielDetail) {
  return (
    materiel.etat_materiel?.libelle ||
    materiel.etat_materiel?.code ||
    'Non défini'
  );
}

function getTypeLabel(materiel: MaterielDetail) {
  return materiel.type_materiel?.libelle || 'Non défini';
}

/**
 * Champs liés :
 * On affiche le libellé uniquement.
 * Si le libellé n’existe pas, on affiche le code en secours.
 */
function getModeleLabel(materiel: MaterielDetail) {
  const modele = materiel.modele;
  if (!modele) return 'Aucun modèle';

  return modele.libelle || modele.code || `MOD-${modele.idModele}`;
}

function getArticleLabel(materiel: MaterielDetail) {
  const article = materiel.modele?.article as any;

  if (!article) return null;

  return (
    article.designation ||
    article.libelle ||
    article.reference ||
    article.code ||
    `ART-${article.idArticle}`
  );
}

function getPointStructureLabel(materiel: MaterielDetail) {
  const point = materiel.point_structure;
  if (!point) return 'Aucun point de structure';

  return point.libelle || point.code || `PS-${point.idPoint}`;
}

function getParentLabel(materiel: MaterielDetail) {
  const parent = materiel.materielParent;
  if (!parent) return null;

  return parent.libelle || parent.code || `MAT-${parent.idMateriel}`;
}

function getPositionLabel(position?: string | null) {
  if (position === 'EN_STOCK') return 'En réserve';
  if (position === 'SUR_TERRAIN') return 'Sur terrain';
  if (position === 'EN_ATELIER') return 'En atelier';
  if (position === 'AU_REBUT') return 'Au rebut';

  return 'Non définie';
}

function formatCriticite(value?: string | null) {
  if (!value) return null;

  const labels: Record<string, string> = {
    FAIBLE: 'Faible',
    MOYENNE: 'Moyenne',
    ELEVEE: 'Élevée',
    ÉLEVÉE: 'Élevée',
    CRITIQUE: 'Critique',
  };

  return labels[value] || value;
}

function getGammeLabel(plan: any) {
  const declencheur = plan.plan_preventif_declencheur?.[0];
  const gamme = declencheur?.gamme;

  if (!gamme) return '—';

  return gamme.libelle || gamme.code || '—';
}

function getConditionDeclenchement(plan: any) {
  const declencheur = plan.plan_preventif_declencheur?.[0];

  if (!declencheur) return '—';

  if (declencheur.typeDeclencheur === 'TEMPS') {
    return `Tous les ${declencheur.periodiciteValeur ?? '—'} ${
      declencheur.periodiciteUnite ?? ''
    }`;
  }

  if (declencheur.typeDeclencheur === 'COMPTEUR') {
    return `${declencheur.point_mesure?.libelle || 'Compteur'} ${
      declencheur.operateur || '>='
    } ${
      declencheur.seuilValeur ?? declencheur.prochainLancementValeur ?? '—'
    } ${declencheur.point_mesure?.unite || ''}`;
  }

  return declencheur.typeDeclencheur || '—';
}

function getProchainLancement(plan: any) {
  const declencheur = plan.plan_preventif_declencheur?.[0];

  if (!declencheur) return '—';

  if (declencheur.prochainLancementDate) {
    return formatDate(declencheur.prochainLancementDate);
  }

  if (declencheur.prochainLancementValeur) {
    return `${declencheur.prochainLancementValeur} ${
      declencheur.point_mesure?.unite || ''
    }`;
  }

  return '—';
}

export default function MaterielDetailCard({
  materiel,
  refreshing = false,
  onRefresh,
  onEdit,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const materielActif = materiel.actif !== false;

  const code = materiel.code || `MAT-${materiel.idMateriel}`;
  const libelle = materiel.libelle || 'Matériel sans libellé';

  const modele = materiel.modele;
  const pointStructure = materiel.point_structure;

  const plansModele = ((materiel as any).plansPreventifsPredefinisModele ??
    []) as any[];

  const plansReels = ((materiel as any).plan_preventif ?? []) as any[];
  const pointsMesure = ((materiel as any).points_mesure ?? []) as any[];
  const interventions = ((materiel as any).intervention ?? []) as any[];
  const sousMateriels = ((materiel as any).sousMateriels ?? []) as any[];

  const firstAvailablePPP = plansModele.find(
    (ppp) =>
      !plansReels.some(
        (plan) =>
          plan.idPlanPreventifPredefiniSource ===
          ppp.idPlanPreventifPredefini,
      ),
  );

  const canGenerateFromModel = materielActif && Boolean(firstAvailablePPP);

  async function handleGeneratePlan(idPPP: number) {
    try {
      setGeneratingId(idPPP);

      await genererPlanPreventifDepuisPPP(materiel.idMateriel, idPPP);
      await onRefresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la génération du plan préventif.',
      );
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#06475a] to-[#0b5d73] px-6 py-5 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <HardDrive size={29} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
                Fiche matériel
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="min-w-0 break-words text-3xl font-black tracking-tight">
                  {code}
                </h1>

                <AppBadge>{getEtatLabel(materiel)}</AppBadge>

                <AppBadge>{materielActif ? 'Actif' : 'Inactif'}</AppBadge>
              </div>

              <p className="mt-2 min-w-0 break-words text-sm font-semibold text-white/75">
                {libelle}
                {materiel.numeroSerie && <> · Série : {materiel.numeroSerie}</>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Actualiser
            </button>

            {materielActif ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0b3d4f] shadow-sm transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                Modifier
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Ce matériel est inactif. Réactivez-le avant modification."
                className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-black text-slate-400"
              >
                <Pencil size={16} />
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition',
                  active
                    ? 'bg-white text-[#06475a] shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900',
                ].join(' ')}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <AppSection title="Généralités">
              <AppFieldGrid>
                <AppReadField label="Code" value={code} />

                <AppReadField label="Libellé" value={libelle} />

                <AppReadField
                  label="N° de série"
                  value={formatValue(materiel.numeroSerie)}
                />

                <AppReadField label="Modèle" value={getModeleLabel(materiel)} />

                <AppReadField
                  label="Type matériel"
                  value={getTypeLabel(materiel)}
                />

                <OptionalReadField
                  label="Article"
                  value={getArticleLabel(materiel)}
                />

                <OptionalReadField
                  label="Marque"
                  value={(modele as any)?.marque?.libelle}
                />

                <OptionalReadField
                  label="Criticité"
                  value={formatCriticite((modele as any)?.criticite)}
                />

                <OptionalReadField
                  label="Réparable"
                  value={
                    (modele as any)?.reparable === null ||
                    (modele as any)?.reparable === undefined
                      ? null
                      : formatValue((modele as any).reparable)
                  }
                />

                <AppReadField
                  label="Actif"
                  value={<ActifBadge actif={materiel.actif} />}
                />
              </AppFieldGrid>
            </AppSection>

            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <AppSection title="Affectation">
                <AppFieldGrid>
                  <AppReadField
                    label="Organisation"
                    value={pointStructure?.organisation || 'BMT'}
                  />

                  <AppReadField
                    label="Père géographique"
                    value={getPointStructureLabel(materiel)}
                  />

                  <OptionalReadField
                    label="Père principal"
                    value={pointStructure?.libelle}
                  />

                  <OptionalReadField
                    label="Père matériel"
                    value={getParentLabel(materiel)}
                  />

                  <OptionalReadField
                    label="Responsable"
                    value={pointStructure?.responsable}
                  />

                  <OptionalReadField
                    label="Centre de coût"
                    value={pointStructure?.centreCout}
                  />

                  <AppReadField
                    label="Position actuelle"
                    value={getPositionLabel(materiel.positionActuelle)}
                  />

                  <AppReadField
                    label="Sous-matériels"
                    value={`${sousMateriels.length} élément(s)`}
                  />
                </AppFieldGrid>
              </AppSection>

              <AppSection title="Cycle de vie">
                <div className="min-w-0">
                  <AppReadField label="État" value={getEtatLabel(materiel)} />

                  <AppReadField
                    label="Dernier inventaire"
                    value={formatDate(materiel.dateDernierInventaire)}
                  />

                  <AppReadField
                    label="Mise en service"
                    value={formatDate(materiel.dateMiseService)}
                  />

                  <OptionalReadField
                    label="Date rebut"
                    value={
                      materiel.dateRebut
                        ? formatDate(materiel.dateRebut)
                        : null
                    }
                  />

                  <OptionalReadField
                    label="Motif rebut"
                    value={materiel.motifRebut}
                  />
                </div>
              </AppSection>
            </div>
          </div>
        )}

        {activeTab === 'preventif' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Plans préventifs
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Liste des plans préventifs rattachés au matériel.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!materielActif}
                  onClick={() => {
                    if (!materielActif) return;

                    router.push(
                      `/plans-preventifs/nouveau?idMateriel=${materiel.idMateriel}`,
                    );
                  }}
                  className={[
                    'rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black transition',
                    materielActif
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'cursor-not-allowed text-slate-400 opacity-60',
                  ].join(' ')}
                >
                  + Nouveau plan
                </button>

                <button
                  type="button"
                  disabled={!canGenerateFromModel || generatingId !== null}
                  onClick={() => {
                    if (!firstAvailablePPP) return;

                    handleGeneratePlan(
                      firstAvailablePPP.idPlanPreventifPredefini,
                    );
                  }}
                  className={[
                    'rounded-xl px-4 py-2 text-xs font-black transition',
                    canGenerateFromModel
                      ? 'bg-[#06475a] text-white hover:bg-[#043747]'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400',
                  ].join(' ')}
                >
                  {generatingId !== null
                    ? 'Génération...'
                    : canGenerateFromModel
                      ? 'Générer depuis modèle'
                      : 'Indisponible'}
                </button>
              </div>
            </div>

            <PreventifCarlTable
              plans={plansReels}
              empty="Aucun plan préventif rattaché à ce matériel."
              onOpenPlan={(idPlan) => router.push(`/plans-preventifs/${idPlan}`)}
            />
          </div>
        )}

        {activeTab === 'mesures' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Points de mesure
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Liste des points de mesure rattachés à ce matériel.
                </p>
              </div>
            </div>

            <MesuresCarlTable
              points={pointsMesure}
              empty="Aucun point de mesure rattaché à ce matériel."
              onOpenPoint={(idPointMesure) =>
                router.push(`/points-mesure/${idPointMesure}`)
              }
            />
          </div>
        )}

        {activeTab === 'interventions' && (
          <DataPanel
            title="Dernières interventions"
            count={interventions.length}
            empty="Aucune intervention enregistrée pour ce matériel."
          >
            {interventions.slice(0, 8).map((intervention) => (
              <RowItem
                key={intervention.idIntervention}
                title={
                  intervention.code ||
                  `Intervention ${intervention.idIntervention}`
                }
                subtitle={[
                  intervention.typeMaintenance,
                  formatDate(intervention.dateDebut),
                  formatDate(intervention.dateFin),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                badge={intervention.etat || '—'}
              />
            ))}
          </DataPanel>
        )}
      </div>
    </div>
  );
}

function OptionalReadField({
  label,
  value,
}: {
  label: string;
  value?: ReactNode | null;
}) {
  if (!hasValue(value)) return null;

  return <AppReadField label={label} value={value} />;
}

function ActifBadge({ actif }: { actif?: boolean | null }) {
  const isActif = actif !== false;

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
        isActif
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      {isActif ? 'Actif' : 'Inactif'}
    </span>
  );
}

function DataPanel({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          {title}
        </h2>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#06475a] ring-1 ring-slate-200">
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-bold text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function PreventifCarlTable({
  plans,
  empty,
  onOpenPlan,
}: {
  plans: any[];
  empty: string;
  onOpenPlan: (idPlan: number) => void;
}) {
  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#06475a] text-white">
              <th className="px-4 py-3 text-left font-black">
                Plan préventif
              </th>
              <th className="px-4 py-3 text-left font-black">Gamme / FM</th>
              <th className="px-4 py-3 text-left font-black">Titre</th>
              <th className="px-4 py-3 text-left font-black">État</th>
              <th className="px-4 py-3 text-left font-black">
                Condition de déclenchement
              </th>
              <th className="px-4 py-3 text-left font-black">
                Prochain lancement
              </th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan, index) => (
              <tr
                key={plan.idPlanPreventif}
                onClick={() => onOpenPlan(plan.idPlanPreventif)}
                className={[
                  'cursor-pointer border-b border-slate-100 transition hover:bg-cyan-50/70',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-black text-slate-900">
                  {plan.code || `PP-${plan.idPlanPreventif}`}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {getGammeLabel(plan)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-700">
                  {plan.libelle || plan.titre || '—'}
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {plan.etat || 'Actif'}
                  </span>
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {getConditionDeclenchement(plan)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {getProchainLancement(plan)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MesuresCarlTable({
  points,
  empty,
  onOpenPoint,
}: {
  points: any[];
  empty: string;
  onOpenPoint: (idPointMesure: number) => void;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#06475a] text-white">
              <th className="px-4 py-3 text-left font-black">
                Point de mesure
              </th>
              <th className="px-4 py-3 text-left font-black">Titre</th>
              <th className="px-4 py-3 text-left font-black">Type</th>
              <th className="px-4 py-3 text-left font-black">Actif</th>
              <th className="px-4 py-3 text-left font-black">
                Dernier relevé
              </th>
            </tr>
          </thead>

          <tbody>
            {points.map((point, index) => (
              <tr
                key={point.idPointMesure}
                onClick={() => onOpenPoint(point.idPointMesure)}
                className={[
                  'cursor-pointer border-b border-slate-100 transition hover:bg-cyan-50/70',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-black text-slate-900">
                  {point.code || `PM-${point.idPointMesure}`}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-700">
                  {point.libelle || '—'}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {point.type || '—'}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-black',
                      point.actif === false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-50 text-emerald-700',
                    ].join(' ')}
                  >
                    {point.actif === false ? 'Inactif' : 'Actif'}
                  </span>
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {point.derniereValeur
                    ? `${point.derniereValeur}${
                        point.unite ? ` ${point.unite}` : ''
                      }`
                    : '—'}

                  {point.derniereDate && (
                    <span className="block text-xs font-bold text-slate-400">
                      {formatDate(point.derniereDate)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowItem({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="min-w-0 break-words text-sm font-black text-slate-950">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 min-w-0 break-words text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {badge}
        </span>
      )}
    </div>
  );
}