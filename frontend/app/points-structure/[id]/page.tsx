'use client';

import { useParams, useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  HardHat,
  Layers3,
  Loader2,
  MapPin,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';

import { getPointStructure } from '@/features/points-structure/services/point-structure.service';
import { PointStructureDetail } from '@/features/points-structure/types/point-structure.type';

type DetailPointStructure = PointStructureDetail & {
  etat?: string | null;
  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean | null;
  criticite?: string | null;
  observationMaintenance?: string | null;

  zoneSensible?: boolean | null;
  accesRestreint?: boolean | null;
  epiObligatoire?: boolean | null;
  consigneSecurite?: string | null;

  placement?: {
    typeArborescence?: string | null;
    parentPointId?: number | null;
    ordre?: number | null;
    parent?: {
      idPoint?: number;
      code?: string | null;
      libelle?: string | null;
    } | null;
  } | null;

  parent?: {
    idPoint?: number;
    code?: string | null;
    libelle?: string | null;
  } | null;
};

export default function DetailPointStructurePage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const rawId = params.id;
    return Number(Array.isArray(rawId) ? rawId[0] : rawId);
  }, [params.id]);

  const [point, setPoint] = useState<DetailPointStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPoint = useCallback(async () => {
    if (Number.isNaN(id) || id <= 0) {
      setError('Identifiant du point de structure invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getPointStructure(id);
      setPoint(data as DetailPointStructure);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement du point de structure.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPoint();
  }, [loadPoint]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <div className="mx-auto flex min-h-[420px] max-w-[1180px] items-center justify-center">
          <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-[#06475a]" size={32} />
            <p className="mt-4 text-sm font-bold text-slate-500">
              Chargement du point de structure...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !point) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
        <section className="mx-auto max-w-[1180px]">
          <BackButton onClick={() => router.back()} />

          <div className="rounded-[24px] border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-950">
                  Point de structure introuvable
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {error || 'Impossible de charger les informations de ce point.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isGeo = point.typePoint === 'GEOGRAPHIQUE';

  const parentLabel = point.parent?.idPoint
    ? `${point.parent.code || 'Sans code'} — ${
        point.parent.libelle || 'Sans libellé'
      }`
    : point.placement?.parent?.idPoint
      ? `${point.placement.parent.code || 'Sans code'} — ${
          point.placement.parent.libelle || 'Sans libellé'
        }`
      : point.placement?.parentPointId
        ? `Point parent #${point.placement.parentPointId}`
        : 'Point racine';

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f5f7fb] px-5 py-6">
      <section className="mx-auto max-w-[1180px]">
        <BackButton onClick={() => router.back()} />

        <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-4">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
          isGeo
            ? 'bg-blue-50 text-blue-700'
            : 'bg-cyan-50 text-[#06475a]'
        }`}
      >
        {isGeo ? <MapPin size={28} /> : <GitBranch size={28} />}
      </div>

      <div>
       

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            {point.libelle || 'Sans libellé'}
          </h1>

         
          <span
            className={`rounded-xl px-3 py-1 text-sm font-bold ${
              point.actif
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {point.actif ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={loadPoint}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCcw size={16} />
        Actualiser
      </button>

      <button
        type="button"
        onClick={() =>
          router.push(`/points-structure/${point.idPoint}/modifier`)
        }
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
                <Info label="Code" value={point.code} />
                <Info label="Libellé" value={point.libelle} />
                <Info label="Type" value={formatTypePoint(point.typePoint)} />
                <Info label="Catégorie" value={point.categorie} />
                <Info label="État" value={formatEtat(point.etat)} />
                <Info label="Statut" value={point.actif ? 'Actif' : 'Inactif'} />
              </InfoGrid>

              <InfoBlock label="Description" value={point.description} />
            </Card>

            <Card title="Organisation" icon={<Building2 size={19} />}>
              <InfoGrid>
                <Info label="Responsable" value={point.responsable} />
                <Info label="Organisation" value={point.organisation} />
                <Info label="Centre de coût" value={point.centreCout} />
              </InfoGrid>
            </Card>

            <Card title="Maintenance" icon={<Wrench size={19} />}>
              <InfoGrid>
                <Info
                  label="Interventions autorisées"
                  value={formatBoolean(point.interventionsAutorisees)}
                />
                <Info label="Criticité" value={formatCriticite(point.criticite)} />
              </InfoGrid>

              <InfoBlock
                label="Observation maintenance"
                value={point.observationMaintenance}
              />
            </Card>

            <Card title="Sécurité" icon={<ShieldCheck size={19} />}>
              <div className="grid gap-3 md:grid-cols-3">
                <SecurityLine
                  icon={<CircleAlert size={17} />}
                  label="Zone sensible"
                  active={Boolean(point.zoneSensible)}
                />

                <SecurityLine
                  icon={<ShieldCheck size={17} />}
                  label="Accès restreint"
                  active={Boolean(point.accesRestreint)}
                />

                <SecurityLine
                  icon={<HardHat size={17} />}
                  label="EPI obligatoire"
                  active={Boolean(point.epiObligatoire)}
                />
              </div>

              <InfoBlock
                label="Consigne de sécurité"
                value={point.consigneSecurite}
              />
            </Card>
          </div>

          <aside className="space-y-5">
            <Card title="Arborescence" icon={<GitBranch size={19} />}>
              <SideInfo
                label="Type d’arborescence"
                value={formatTypePoint(
                  point.placement?.typeArborescence || point.typePoint,
                )}
              />

              <SideInfo label="Point parent" value={parentLabel} />

              <SideInfo
                label="Ordre d’affichage"
                value={
                  point.placement?.ordre !== null &&
                  point.placement?.ordre !== undefined
                    ? String(point.placement.ordre)
                    : null
                }
              />
            </Card>

            <Card title="Résumé" icon={<CheckCircle2 size={19} />}>
              <div className="space-y-3">
                <StatusBadge
                  label="Type"
                  value={formatTypePoint(point.typePoint)}
                  variant={isGeo ? 'blue' : 'cyan'}
                />

                <StatusBadge
                  label="Statut"
                  value={point.actif ? 'Actif' : 'Inactif'}
                  variant={point.actif ? 'green' : 'slate'}
                />

                <StatusBadge
                  label="Criticité"
                  value={formatCriticite(point.criticite)}
                  variant={getCriticiteVariant(point.criticite)}
                />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
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

function HeaderInfo({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="border-b border-slate-100 px-6 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-slate-950">
        {value || 'Non renseigné'}
      </p>
    </div>
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
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-[#06475a]">
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

function SecurityLine({
  icon,
  label,
  active,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold">{label}</span>
      </div>

      {active ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
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
  variant: 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'slate';
}) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    cyan: 'bg-cyan-50 text-[#06475a] border-cyan-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
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

function formatTypePoint(type?: string | null) {
  if (type === 'GEOGRAPHIQUE') return 'Géographique';
  if (type === 'TECHNIQUE') return 'Technique';
  return 'Non renseigné';
}

function formatEtat(etat?: string | null) {
  if (etat === 'BROUILLON') return 'Brouillon';
  if (etat === 'VALIDE') return 'Validé';
  if (etat === 'ARCHIVE') return 'Archivé';
  return etat || 'Non renseigné';
}

function formatCriticite(criticite?: string | null) {
  if (criticite === 'FAIBLE') return 'Faible';
  if (criticite === 'MOYENNE') return 'Moyenne';
  if (criticite === 'ELEVEE') return 'Élevée';
  if (criticite === 'CRITIQUE') return 'Critique';
  return criticite || 'Non renseignée';
}

function getCriticiteVariant(
  criticite?: string | null,
): 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'slate' {
  if (criticite === 'FAIBLE') return 'green';
  if (criticite === 'MOYENNE') return 'blue';
  if (criticite === 'ELEVEE') return 'orange';
  if (criticite === 'CRITIQUE') return 'red';
  return 'slate';
}

function formatBoolean(value?: boolean | null) {
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  return 'Non renseigné';
}