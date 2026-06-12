

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Boxes, CalendarClock, Pencil, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { ModeleApi } from '@/features/modeles/types/modele';

type MaterielLite = {
  idMateriel: number;
  code?: string | null;
  numeroSerie?: string | null;
  actif?: boolean | null;
};

type DeclencheurLite = {
  typeDeclencheur?: string | null;
  periodiciteValeur?: number | string | null;
  periodiciteUnite?: string | null;
  operateur?: string | null;
  seuilValeur?: number | string | null;
  nombreJoursPremierLancement?: number | string | null;
  gamme?: {
    idGamme?: number;
    code?: string | null;
    libelle?: string | null;
  } | null;
  point_mesure?: {
    code?: string | null;
    libelle?: string | null;
    unite?: string | null;
  } | null;
};

type PlanPreventifPredefiniLite = {
  idPlanPreventifPredefini: number;
  code?: string | null;
  libelle?: string | null;
  titre?: string | null;
  description?: string | null;
  etat?: string | null;
  actif?: boolean | null;
  ppp_declencheur?: DeclencheurLite[];
};

type ModelePppAssociationLite = {
  idModelePlanPreventifPredefini?: number;
  idPlanPreventifPredefini: number;
  principal?: boolean | null;
  actif?: boolean | null;
  plan_preventif_predefini?: PlanPreventifPredefiniLite | null;
};

export type ModeleDetail = Omit<
  ModeleApi,
  'modele_plan_preventif_predefini'
> & {
  materiel?: MaterielLite[];
   actif?: boolean | null;
  gamme?: unknown[];
  articles?: unknown[];
  plan_preventif_predefini?: PlanPreventifPredefiniLite[];
  modele_plan_preventif_predefini?: ModelePppAssociationLite[];
};

type Props = {
  modele: ModeleDetail;
  refreshing?: boolean;
  onRefresh: () => void;
  onEdit: () => void;
};

type TabId = 'general' | 'preventif';

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'general', label: 'Général', icon: <Boxes size={17} /> },
  { id: 'preventif', label: 'Préventif', icon: <CalendarClock size={17} /> },
];

function display(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}

function formatBudget(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return `${new Intl.NumberFormat('fr-DZ', {
    maximumFractionDigits: 2,
  }).format(numberValue)} DA`;
}

function getGammeLabel(plan: PlanPreventifPredefiniLite) {
  const gamme = plan.ppp_declencheur?.[0]?.gamme;

  if (!gamme) return '—';

  if (gamme.code && gamme.libelle) {
    return `${gamme.code} — ${gamme.libelle}`;
  }

  return gamme.libelle || gamme.code || `Gamme ${gamme.idGamme}`;
}

function getConditionDeclenchement(plan: PlanPreventifPredefiniLite) {
  const declencheur = plan.ppp_declencheur?.[0];

  if (!declencheur) return '—';

  if (declencheur.typeDeclencheur === 'CALENDAIRE') {
    if (declencheur.periodiciteValeur && declencheur.periodiciteUnite) {
      return `Tous les ${declencheur.periodiciteValeur} ${declencheur.periodiciteUnite}`;
    }

    return 'Calendaire';
  }

  if (
    declencheur.typeDeclencheur === 'COMPTEUR' ||
    declencheur.typeDeclencheur === 'CONDITIONNEL'
  ) {
    const point =
      declencheur.point_mesure?.libelle ||
      declencheur.point_mesure?.code ||
      'Point de mesure';

    const unite = declencheur.point_mesure?.unite
      ? ` ${declencheur.point_mesure.unite}`
      : '';

    return `${point} ${declencheur.operateur || '>='} ${
      declencheur.seuilValeur ?? '—'
    }${unite}`;
  }

  return display(declencheur.typeDeclencheur);
}

function getProchainLancement(plan: PlanPreventifPredefiniLite) {
  const declencheur = plan.ppp_declencheur?.[0];

  if (!declencheur) return '—';

  if (declencheur.nombreJoursPremierLancement) {
    return `J+${declencheur.nombreJoursPremierLancement}`;
  }

  if (declencheur.periodiciteValeur && declencheur.periodiciteUnite) {
    return `${declencheur.periodiciteValeur} ${declencheur.periodiciteUnite}`;
  }

  return '—';
}

export default function ModeleDetailCard({
  modele,
  refreshing = false,
  onRefresh,
  onEdit,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const code = modele.code || `MOD-${modele.idModele}`;
  const libelle = modele.libelle || 'Sans libellé';

  const etatLabel =
    modele.etat_modele?.libelle || modele.etat_modele?.code || 'Non défini';

  const typeLabel =
    modele.type_equipement?.libelle ||
    modele.type_equipement?.code ||
    'Non défini';

  const familleLabel =
    modele.famille?.libelle || modele.famille?.code || 'Aucune';

  const fabricantLabel = modele.fabricant?.nom || modele.fabricant?.code || '—';

  const marqueLabel = modele.marque?.libelle || modele.marque?.code || '—';

  const nbMateriels = modele.materiel?.length ?? 0;

  const pppAssociations = modele.modele_plan_preventif_predefini ?? [];
  const legacyPpp = modele.plan_preventif_predefini ?? [];

  const preventifPlans: PlanPreventifPredefiniLite[] =
    pppAssociations.length > 0
      ? pppAssociations.map((association) => {
          const ppp = association.plan_preventif_predefini;

          return {
            idPlanPreventifPredefini: association.idPlanPreventifPredefini,
            code: ppp?.code,
            libelle: ppp?.libelle,
            titre: ppp?.titre,
            description: ppp?.description,
            etat: ppp?.etat,
            actif: ppp?.actif ?? association.actif,
            ppp_declencheur: ppp?.ppp_declencheur,
          };
        })
      : legacyPpp;

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#06475a] to-[#0b5d73] px-6 py-5 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Boxes size={29} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
                Fiche modèle
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">{code}</h1>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  {etatLabel}
                </span>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  {modele.actif === false ? 'Inactif' : 'Actif'}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-white/75">
                {libelle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Actualiser
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#06475a] transition hover:bg-slate-100"
            >
              <Pencil size={16} />
              Modifier
            </button>
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
            <Section title="Généralités">
              <FieldGrid>
                <Field label="Code" value={code} />
                <Field label="Libellé" value={libelle} />
                <Field label="Famille" value={familleLabel} />
                <Field label="Type" value={typeLabel} />
                <Field label="État" value={etatLabel} />
                <Field label="Matériels" value={String(nbMateriels)} />
                <Field label="Type d'équipement" value={typeLabel} />
                <Field label="Fabricant" value={fabricantLabel} />
                <Field label="Marque" value={marqueLabel} />
                <Field
                  label="Durée de vie"
                  value={modele.dureeVie ? `${modele.dureeVie} ans` : '—'}
                />
                <Field label="Budget" value={formatBudget(modele.budget)} />
              </FieldGrid>
            </Section>

            <Section title="Matériels rattachés">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Liste des matériels associés à ce modèle.
                </p>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#06475a] ring-1 ring-slate-200">
                  {nbMateriels}
                </span>
              </div>

              {!modele.materiel || modele.materiel.length === 0 ? (
                <EmptyMessage>
                  Aucun matériel rattaché à ce modèle.
                </EmptyMessage>
              ) : (
                <div className="space-y-2">
                  {modele.materiel.map((materiel) => (
                    <ListItem
                      key={materiel.idMateriel}
                      title={materiel.numeroSerie || materiel.code || '-'}
                      subtitle={`Code : ${materiel.code || '-'}`}
                      badge={materiel.actif ? 'Actif' : 'Inactif'}
                      active={materiel.actif !== false}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {activeTab === 'preventif' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Plans préventifs prédéfinis
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Liste des plans préventifs prédéfinis associés au modèle.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#06475a] ring-1 ring-slate-200">
                {preventifPlans.length}
              </span>
            </div>

            {preventifPlans.length === 0 ? (
              <EmptyMessage>
                Aucun plan préventif prédéfini associé à ce modèle.
              </EmptyMessage>
            ) : (
              <PreventifTable
                plans={preventifPlans}
                onOpenPlan={(idPlan) =>
                  router.push(`/plans-preventifs-predefinis/${idPlan}`)
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PreventifTable({
  plans,
  onOpenPlan,
}: {
  plans: PlanPreventifPredefiniLite[];
  onOpenPlan: (idPlan: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#06475a] text-white">
              <th className="px-4 py-3 text-left font-black">Plan préventif</th>
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
                key={plan.idPlanPreventifPredefini}
                onClick={() => onOpenPlan(plan.idPlanPreventifPredefini)}
                className={[
                  'cursor-pointer border-b border-slate-100 transition hover:bg-cyan-50/70',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-black text-slate-900">
                  {plan.code || `PPP-${plan.idPlanPreventifPredefini}`}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-600">
                  {getGammeLabel(plan)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-700">
                  {plan.titre || plan.libelle || '—'}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-black',
                      plan.actif === false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-blue-50 text-blue-700',
                    ].join(' ')}
                  >
                    {plan.etat || (plan.actif === false ? 'Inactif' : 'Actif')}
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[#06475a]" />

        <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          {title}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        {children}
      </div>
    </section>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-start gap-3 border-b border-slate-200/70 pb-3 last:border-b-0">
      <p className="text-sm font-bold text-slate-500">{label}</p>

      <div className="text-sm font-black text-slate-900">{value || '—'}</div>
    </div>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-400">
      {children}
    </div>
  );
}

function ListItem({
  title,
  subtitle,
  badge,
  active = false,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="font-black text-slate-900">{title}</p>

        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <span
          className={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
            active ? 'bg-[#06475a] text-white' : 'bg-blue-50 text-blue-700',
          ].join(' ')}
        >
          {badge}
        </span>
      )}
    </div>
  );
}