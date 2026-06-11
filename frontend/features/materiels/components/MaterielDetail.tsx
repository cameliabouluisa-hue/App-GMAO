

import type { ReactNode } from 'react';

import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Gauge,
  HardDrive,
  Layers3,
  MapPin,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import type { Materiel } from '@/features/materiels/types/materiel';

export type MaterielDetail = Materiel;

type Props = {
  materiel: MaterielDetail;
  refreshing?: boolean;
  onRefresh: () => void;
  onEdit: () => void;
};

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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

function getModeleLabel(materiel: MaterielDetail) {
  const modele = materiel.modele;

  if (!modele) return 'Aucun modèle';

  if (modele.code && modele.libelle) {
    return `${modele.code} — ${modele.libelle}`;
  }

  return modele.libelle || modele.code || `MOD-${modele.idModele}`;
}

function getArticleLabel(materiel: MaterielDetail) {
  const article = materiel.modele?.article;

  if (!article) return '—';

  if (article.reference && article.designation) {
    return `${article.reference} — ${article.designation}`;
  }

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

  if (point.code && point.libelle) {
    return `${point.code} — ${point.libelle}`;
  }

  return point.libelle || point.code || `PS-${point.idPoint}`;
}

function getParentLabel(materiel: MaterielDetail) {
  const parent = materiel.materielParent;

  if (!parent) return 'Aucun matériel parent';

  if (parent.code && parent.libelle) {
    return `${parent.code} — ${parent.libelle}`;
  }

  return parent.libelle || parent.code || `MAT-${parent.idMateriel}`;
}

function getPositionLabel(position?: string | null) {
  if (position === 'EN_STOCK') return 'En réserve';
  if (position === 'SUR_TERRAIN') return 'Sur terrain';
  if (position === 'EN_ATELIER') return 'En atelier';
  if (position === 'AU_REBUT') return 'Au rebut';
  return 'Non définie';
}

function getEtatBadgeClass(code?: string | null) {
  if (code === 'VALIDE') return 'bg-emerald-50 text-emerald-700';
  if (code === 'EN_PANNE') return 'bg-red-50 text-red-700';
  if (code === 'EN_REVISION') return 'bg-orange-50 text-orange-700';
  if (code === 'AU_REBUT' || code === 'ANNULE') {
    return 'bg-slate-100 text-slate-500';
  }

  return 'bg-blue-50 text-blue-700';
}

function formatPointMesureValue(
  value?: number | string | null,
  unite?: string | null,
) {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}${unite ? ` ${unite}` : ''}`;
}

function formatCriticite(value?: string | null) {
  if (!value) return '—';

  const labels: Record<string, string> = {
    FAIBLE: 'Faible',
    MOYENNE: 'Moyenne',
    ELEVEE: 'Élevée',
    CRITIQUE: 'Critique',
  };

  return labels[value] || value;
}

function formatNiveauMaintenance(value?: string | null) {
  if (!value) return '—';

  const labels: Record<string, string> = {
    NIVEAU_1: 'Niveau 1',
    NIVEAU_2: 'Niveau 2',
    NIVEAU_3: 'Niveau 3',
    NIVEAU_4: 'Niveau 4',
    NIVEAU_5: 'Niveau 5',
  };

  return labels[value] || value;
}

export default function MaterielDetailCard({
  materiel,
  refreshing = false,
  onRefresh,
  onEdit,
}: Props) {
  const code = materiel.code || `MAT-${materiel.idMateriel}`;
  const libelle = materiel.libelle || 'Matériel sans libellé';

  const etatLabel = getEtatLabel(materiel);
  const typeLabel = getTypeLabel(materiel);
  const modeleLabel = getModeleLabel(materiel);
  const articleLabel = getArticleLabel(materiel);
  const pointStructureLabel = getPointStructureLabel(materiel);
  const parentLabel = getParentLabel(materiel);

  const modele = materiel.modele;
  const pointStructure = materiel.point_structure;

  const pointsMesure = materiel.points_mesure ?? [];
  const plansReels = materiel.plan_preventif ?? [];
  const plansModele = materiel.plansPreventifsPredefinisModele ?? [];
  const sousMateriels = materiel.sousMateriels ?? [];
  const interventions = materiel.intervention ?? [];

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#06475a]">
              <HardDrive size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Détail du matériel
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {code}
                </h1>

                <span
                  className={`rounded-xl px-3 py-1 text-sm font-bold ${getEtatBadgeClass(
                    materiel.etat_materiel?.code,
                  )}`}
                >
                  {etatLabel}
                </span>

                <span
                  className={`rounded-xl px-3 py-1 text-sm font-bold ${
                    materiel.actif === false
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {materiel.actif === false ? 'Inactif' : 'Actif'}
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {libelle} · Série :{' '}
                <span className="text-slate-800">
                  {formatValue(materiel.numeroSerie)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-5 text-sm font-bold text-white shadow-md shadow-[#06475a]/20 transition hover:bg-[#043747]"
            >
              <Pencil size={16} />
              Modifier
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Card title="Généralités" icon={<Layers3 size={19} />}>
              <InfoGrid>
                <Info label="Code" value={code} />
                <Info label="Libellé" value={libelle} />
                <Info label="N° de série" value={formatValue(materiel.numeroSerie)} />
                <Info label="Type matériel" value={typeLabel} />
                <Info label="État" value={etatLabel} />
                <Info
                  label="Statut"
                  value={materiel.actif === false ? 'Inactif' : 'Actif'}
                />
              </InfoGrid>
            </Card>

            <Card title="Modèle et classification" icon={<Wrench size={19} />}>
              <InfoGrid>
                <Info label="Modèle" value={modeleLabel} />
                <Info label="Article lié au modèle" value={articleLabel} />
                <Info
                  label="Famille"
                  value={formatValue(modele?.famille?.libelle)}
                />
                <Info
                  label="Type équipement"
                  value={formatValue(modele?.type_equipement?.libelle)}
                />
                <Info
                  label="Fabricant"
                  value={formatValue(modele?.fabricant?.nom)}
                />
                <Info
                  label="Marque"
                  value={formatValue(modele?.marque?.libelle)}
                />
                <Info
                  label="Référence constructeur"
                  value={formatValue(modele?.referenceConstructeur)}
                />
                <Info label="Version" value={formatValue(modele?.version)} />
                <Info
                  label="Criticité"
                  value={formatCriticite(modele?.criticite)}
                />
                <Info
                  label="Niveau maintenance"
                  value={formatNiveauMaintenance(modele?.niveauMaintenance)}
                />
                <Info
                  label="Réparable"
                  value={formatValue(modele?.reparable)}
                />
                <Info
                  label="Durée de vie"
                  value={
                    modele?.dureeVie
                      ? `${modele.dureeVie} mois`
                      : '—'
                  }
                />
              </InfoGrid>
            </Card>

            <Card title="Affectation" icon={<MapPin size={19} />}>
              <InfoGrid>
                <Info label="Point de structure" value={pointStructureLabel} />
                <Info
                  label="Type point"
                  value={formatValue(pointStructure?.typePoint)}
                />
                <Info
                  label="Organisation"
                  value={formatValue(pointStructure?.organisation)}
                />
                <Info
                  label="Responsable"
                  value={formatValue(pointStructure?.responsable)}
                />
                <Info
                  label="Centre de coût"
                  value={formatValue(pointStructure?.centreCout)}
                />
                <Info
                  label="Position actuelle"
                  value={getPositionLabel(materiel.positionActuelle)}
                />
                <Info label="Matériel parent" value={parentLabel} />
                <Info
                  label="Sous-matériels"
                  value={`${sousMateriels.length} élément(s)`}
                />
              </InfoGrid>

              {sousMateriels.length > 0 && (
                <div className="mt-5 space-y-3">
                  {sousMateriels.map((item) => (
                    <ListItem
                      key={item.idMateriel}
                      title={item.libelle || item.code || `MAT-${item.idMateriel}`}
                      subtitle={item.code || 'Sans code'}
                      badge={item.etat_materiel?.libelle || item.etat_materiel?.code || '—'}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Points de mesure" icon={<Gauge size={19} />}>
              {pointsMesure.length === 0 ? (
                <EmptyBlock text="Aucun point de mesure rattaché à ce matériel." />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {pointsMesure.map((point) => (
                    <div
                      key={point.idPointMesure}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {point.code}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {point.libelle}
                          </p>
                        </div>

                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-black ${
                            point.actif === false
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {point.actif === false ? 'Inactif' : 'Actif'}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MiniInfo label="Type" value={formatValue(point.type)} />
                        <MiniInfo label="Unité" value={formatValue(point.unite)} />
                        <MiniInfo
                          label="Dernière valeur"
                          value={formatPointMesureValue(
                            point.derniereValeur,
                            point.unite,
                          )}
                        />
                        <MiniInfo
                          label="Dernier relevé"
                          value={formatDate(point.derniereDate)}
                        />
                        <MiniInfo
                          label="Surveillance min."
                          value={formatPointMesureValue(
                            point.surveillanceMin,
                            point.unite,
                          )}
                        />
                        <MiniInfo
                          label="Surveillance max."
                          value={formatPointMesureValue(
                            point.surveillanceMax,
                            point.unite,
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Préventif" icon={<CalendarClock size={19} />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <PreventifBlock
                  title="Plans hérités du modèle"
                  count={plansModele.length}
                >
                  {plansModele.length === 0 ? (
                    <EmptyBlock text="Aucun plan préventif prédéfini hérité du modèle." />
                  ) : (
                    <div className="space-y-3">
                      {plansModele.map((plan) => (
                        <ListItem
                          key={plan.idPlanPreventifPredefini}
                          title={plan.titre || plan.code}
                          subtitle={[
                            plan.code,
                            plan.typeDeclenchement,
                            plan.organisation,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          badge={plan.etat || '—'}
                        />
                      ))}
                    </div>
                  )}
                </PreventifBlock>

                <PreventifBlock
                  title="Plans rattachés au matériel"
                  count={plansReels.length}
                >
                  {plansReels.length === 0 ? (
                    <EmptyBlock text="Aucun plan préventif rattaché directement au matériel." />
                  ) : (
                    <div className="space-y-3">
                      {plansReels.map((plan) => (
                        <ListItem
                          key={plan.idPlanPreventif}
                          title={plan.libelle || plan.titre || plan.code || `Plan ${plan.idPlanPreventif}`}
                          subtitle={[
                            plan.code,
                            plan.typeDeclenchement,
                            plan.organisation,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          badge={plan.etat || '—'}
                        />
                      ))}
                    </div>
                  )}
                </PreventifBlock>
              </div>
            </Card>

            <Card title="Dernières interventions" icon={<Activity size={19} />}>
              {interventions.length === 0 ? (
                <EmptyBlock text="Aucune intervention enregistrée pour ce matériel." />
              ) : (
                <div className="space-y-3">
                  {interventions.slice(0, 6).map((intervention) => (
                    <ListItem
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
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Cycle de vie" icon={<ShieldCheck size={19} />}>
              <div className="space-y-3">
                <SideInfo label="État actuel" value={etatLabel} />
                <SideInfo
                  label="Mise en service"
                  value={formatDate(materiel.dateMiseService)}
                />
                <SideInfo
                  label="Dernier inventaire"
                  value={formatDate(materiel.dateDernierInventaire)}
                />
                <SideInfo
                  label="Date de rebut"
                  value={formatDate(materiel.dateRebut)}
                />
                <SideInfo
                  label="Motif rebut"
                  value={formatValue(materiel.motifRebut)}
                />
              </div>
            </Card>

            <Card title="Garantie" icon={<CheckCircle2 size={19} />}>
              <div className="space-y-3">
                <SideInfo
                  label="Durée garantie"
                  value={
                    modele?.garantieMois
                      ? `${modele.garantieMois} mois`
                      : '—'
                  }
                />
                <SideInfo
                  label="Fin prévisionnelle"
                  value={formatDate(materiel.dateFinGarantiePrevisionnelle)}
                />
              </div>
            </Card>

            <Card title="Sécurité et criticité" icon={<AlertTriangle size={19} />}>
              <div className="space-y-3">
                <SideInfo
                  label="Criticité modèle"
                  value={formatCriticite(modele?.criticite)}
                />
                <SideInfo
                  label="Criticité emplacement"
                  value={formatValue(pointStructure?.criticite)}
                />
                <SideInfo
                  label="Zone sensible"
                  value={formatValue(pointStructure?.zoneSensible)}
                />
                <SideInfo
                  label="Accès restreint"
                  value={formatValue(pointStructure?.accesRestreint)}
                />
                <SideInfo
                  label="EPI obligatoire"
                  value={formatValue(pointStructure?.epiObligatoire)}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#06475a]">
          {icon}
        </div>

        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function SideInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="max-w-[180px] text-right text-sm font-extrabold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}

function PreventifBlock({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </h3>

        <span className="rounded-xl bg-white px-3 py-1 text-xs font-black text-[#06475a]">
          {count}
        </span>
      </div>

      {children}
    </div>
  );
}

function ListItem({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-extrabold text-slate-900">{title}</p>
        {subtitle && (
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
          {badge}
        </span>
      )}
    </div>
  );
}