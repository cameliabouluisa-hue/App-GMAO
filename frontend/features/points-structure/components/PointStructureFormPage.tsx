
import { Select } from '@/components/select';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Check,
  FileText,
  GitFork,
  MapPin,
  RefreshCcw,
  Save,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';

import { getPointStructureParents } from '../services/point-structure.service';
import {
  CreatePointStructureDto,
  PointStructureListItem,
  UpdatePointStructureDto,
} from '../types/point-structure.type';

type Mode = 'create' | 'edit';

type TypePointValue = 'GEOGRAPHIQUE' | 'TECHNIQUE';
type TypeArborescenceValue = 'GEOGRAPHIQUE' | 'TECHNIQUE';
type EtatPointValue = 'BROUILLON' | 'VALIDE' | 'ARCHIVE';
type CriticiteValue = 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';

type ParentOption = {
  idPoint: number;
  code?: string | null;
  libelle?: string | null;
  typePoint?: TypePointValue | null;
};

type PointStructureInitialData = Partial<PointStructureListItem> & {
  idPoint?: number;
  code?: string | null;
  libelle?: string | null;
  description?: string | null;
  typePoint?: TypePointValue | null;
  actif?: boolean | null;

  etat?: EtatPointValue | string | null;
  categorie?: string | null;
  responsable?: string | null;
  organisation?: string | null;
  centreCout?: string | null;

  interventionsAutorisees?: boolean | null;
  criticite?: CriticiteValue | string | null;
  observationMaintenance?: string | null;

  zoneSensible?: boolean | null;
  accesRestreint?: boolean | null;
  epiObligatoire?: boolean | null;
  consigneSecurite?: string | null;

  typeArborescence?: TypeArborescenceValue | null;
  parentPointId?: number | null;
  ordre?: number | null;
  ordreAffichage?: number | null;

  placement?: {
    typeArborescence?: TypeArborescenceValue | null;
    parentPointId?: number | null;
    ordre?: number | null;
    ordreAffichage?: number | null;
    parent?: {
      idPoint?: number;
      code?: string | null;
      libelle?: string | null;
    } | null;
  } | null;

  lienArborescence?: {
    typeArborescence?: TypeArborescenceValue | null;
    parentPointId?: number | null;
    ordre?: number | null;
    ordreAffichage?: number | null;
  } | null;

  liensArborescence?: Array<{
    typeArborescence?: TypeArborescenceValue | null;
    parentPointId?: number | null;
    ordre?: number | null;
    ordreAffichage?: number | null;
  }>;
};

type FormState = {
  code: string;
  libelle: string;
  description: string;

  typePoint: TypePointValue;
  typeArborescence: TypeArborescenceValue;
  parentPointId: string;
  ordre: string;

  actif: boolean;
  etat: EtatPointValue;

  categorie: string;
  responsable: string;
  organisation: string;
  centreCout: string;

  interventionsAutorisees: boolean;
  criticite: CriticiteValue;
  observationMaintenance: string;

  zoneSensible: boolean;
  accesRestreint: boolean;
  epiObligatoire: boolean;
  consigneSecurite: string;
};

type Props = {
  mode: Mode;
  initialData?: PointStructureInitialData | null;
  onSubmit: (
    data: CreatePointStructureDto | UpdatePointStructureDto,
  ) => Promise<void>;
};

const DEFAULT_FORM: FormState = {
  code: '',
  libelle: '',
  description: '',
  typePoint: 'GEOGRAPHIQUE',
  typeArborescence: 'GEOGRAPHIQUE',
  parentPointId: '',
  ordre: '',
  actif: true,
  etat: 'VALIDE',
  categorie: '',
  responsable: '',
  organisation: '',
  centreCout: '',
  interventionsAutorisees: true,
  criticite: 'MOYENNE',
  observationMaintenance: '',
  zoneSensible: false,
  accesRestreint: false,
  epiObligatoire: false,
  consigneSecurite: '',
};

function isTypePoint(value: unknown): value is TypePointValue {
  return value === 'GEOGRAPHIQUE' || value === 'TECHNIQUE';
}

function isTypeArborescence(value: unknown): value is TypeArborescenceValue {
  return value === 'GEOGRAPHIQUE' || value === 'TECHNIQUE';
}

function normalizeEtat(value: unknown): EtatPointValue {
  if (value === 'BROUILLON' || value === 'VALIDE' || value === 'ARCHIVE') {
    return value;
  }

  return 'VALIDE';
}

function normalizeCriticite(value: unknown): CriticiteValue {
  if (
    value === 'FAIBLE' ||
    value === 'MOYENNE' ||
    value === 'ELEVEE' ||
    value === 'CRITIQUE'
  ) {
    return value;
  }

  return 'MOYENNE';
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPlacement(raw?: PointStructureInitialData | null) {
  if (!raw) return null;

  return (
    raw.placement ??
    raw.lienArborescence ??
    raw.liensArborescence?.[0] ??
    null
  );
}

function buildInitialForm(initialData?: PointStructureInitialData | null): FormState {
  if (!initialData) return DEFAULT_FORM;

  const placement = getPlacement(initialData);

  const typePoint = isTypePoint(initialData.typePoint)
    ? initialData.typePoint
    : DEFAULT_FORM.typePoint;

  const rawTypeArborescence =
    initialData.typeArborescence ?? placement?.typeArborescence ?? typePoint;

  let typeArborescence: TypeArborescenceValue = isTypeArborescence(
    rawTypeArborescence,
  )
    ? rawTypeArborescence
    : 'GEOGRAPHIQUE';

  if (typePoint === 'GEOGRAPHIQUE') {
    typeArborescence = 'GEOGRAPHIQUE';
  }
const parentPointId =
  initialData.parentPointId ??
  placement?.parentPointId ??
  initialData.placement?.parent?.idPoint ??
  null;

  const ordre =
    initialData.ordre ??
    initialData.ordreAffichage ??
    placement?.ordre ??
    placement?.ordreAffichage ??
    null;

  return {
    code: toInputValue(initialData.code),
    libelle: toInputValue(initialData.libelle),
    description: toInputValue(initialData.description),

    typePoint,
    typeArborescence,
    parentPointId: parentPointId ? String(parentPointId) : '',
    ordre: ordre ? String(ordre) : '',

    actif: initialData.actif ?? true,
    etat: normalizeEtat(initialData.etat),

    categorie: toInputValue(initialData.categorie),
    responsable: toInputValue(initialData.responsable),
    organisation: toInputValue(initialData.organisation),
    centreCout: toInputValue(initialData.centreCout),

    interventionsAutorisees: initialData.interventionsAutorisees ?? true,
    criticite: normalizeCriticite(initialData.criticite),
    observationMaintenance: toInputValue(initialData.observationMaintenance),

    zoneSensible: initialData.zoneSensible ?? false,
    accesRestreint: initialData.accesRestreint ?? false,
    epiObligatoire: initialData.epiObligatoire ?? false,
    consigneSecurite: toInputValue(initialData.consigneSecurite),
  };
}

function getTypePointLabel(typePoint: TypePointValue): string {
  return typePoint === 'GEOGRAPHIQUE' ? 'Géographique' : 'Technique';
}

export function PointStructureFormPage({
  mode,
  initialData,
  onSubmit,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(initialData),
  );
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Modifier le point' : 'Nouveau point';
  const submitLabel = isEditMode ? 'Enregistrer' : 'Créer le point';

  const completion = useMemo(() => {
    const fields = [
      form.code,
      form.libelle,
      form.typePoint,
      form.typeArborescence,
      form.etat,
      form.criticite,
      form.categorie,
      form.responsable,
      form.organisation,
      form.centreCout,
    ];

    const filled = fields.filter((field) => String(field).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const selectedParent = useMemo(() => {
    if (!form.parentPointId) return null;

    return parents.find((parent) => String(parent.idPoint) === form.parentPointId);
  }, [form.parentPointId, parents]);

  useEffect(() => {
    setForm(buildInitialForm(initialData));
  }, [initialData]);

  useEffect(() => {
    async function loadParents() {
      try {
        setParentsLoading(true);

        const data = await getPointStructureParents({
          typePoint: form.typeArborescence,
          typeArborescence: form.typeArborescence,
          excludeId: initialData?.idPoint,
        } as never);

        setParents((data ?? []) as ParentOption[]);
      } catch {
        setParents([]);
      } finally {
        setParentsLoading(false);
      }
    }

    loadParents();
  }, [form.typeArborescence, initialData?.idPoint]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleTypePointChange(typePoint: TypePointValue) {
    setForm((previous) => {
      const nextTypeArborescence =
        typePoint === 'GEOGRAPHIQUE'
          ? 'GEOGRAPHIQUE'
          : previous.typeArborescence;

      return {
        ...previous,
        typePoint,
        typeArborescence: nextTypeArborescence,
        parentPointId: '',
      };
    });
  }

  function handleTypeArborescenceChange(typeArborescence: TypeArborescenceValue) {
    if (form.typePoint === 'GEOGRAPHIQUE' && typeArborescence === 'TECHNIQUE') {
      return;
    }

    setForm((previous) => ({
      ...previous,
      typeArborescence,
      parentPointId: '',
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.code.trim()) {
      setError('Le code est obligatoire.');
      return;
    }

    if (!form.libelle.trim()) {
      setError('Le libellé est obligatoire.');
      return;
    }

    if (
      form.typePoint === 'GEOGRAPHIQUE' &&
      form.typeArborescence === 'TECHNIQUE'
    ) {
      setError(
        "Un point géographique ne peut pas être placé dans l’arborescence technique.",
      );
      return;
    }

    const parentPointId = form.parentPointId ? Number(form.parentPointId) : null;
    const ordre = form.ordre ? Number(form.ordre) : null;

    if (form.parentPointId && Number.isNaN(parentPointId)) {
      setError('Le point parent sélectionné est invalide.');
      return;
    }

    if (form.ordre && (Number.isNaN(ordre) || Number(ordre) < 1)) {
      setError('La position sous le parent doit être un nombre positif.');
      return;
    }

    const payload = {
      code: form.code.trim(),
      libelle: form.libelle.trim(),
      description: nullableText(form.description),

      typePoint: form.typePoint,
      typeArborescence: form.typeArborescence,
      parentPointId,
      ordre,

      actif: form.actif,
      etat: form.etat,

      categorie: nullableText(form.categorie),
      responsable: nullableText(form.responsable),
      organisation: nullableText(form.organisation),
      centreCout: nullableText(form.centreCout),

      interventionsAutorisees: form.interventionsAutorisees,
      criticite: form.criticite,
      observationMaintenance: nullableText(form.observationMaintenance),

      zoneSensible: form.zoneSensible,
      accesRestreint: form.accesRestreint,
      epiObligatoire: form.epiObligatoire,
      consigneSecurite: nullableText(form.consigneSecurite),
    } as CreatePointStructureDto | UpdatePointStructureDto;

    try {
      setSaving(true);
      await onSubmit(payload);
      router.push('/points-structure');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l’enregistrement.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-6 text-slate-950">
      <div className="mx-auto max-w-[1280px] pb-24">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour
        </button>

        <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06475a] text-white">
                {form.typePoint === 'GEOGRAPHIQUE' ? (
                  <MapPin className="h-7 w-7" />
                ) : (
                  <GitFork className="h-7 w-7" />
                )}
              </div>

              <div>
              
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge>{getTypePointLabel(form.typePoint)}</Badge>
              <Badge variant={form.actif ? 'success' : 'muted'}>
                {form.actif ? 'Actif' : 'Inactif'}
              </Badge>

              <div className="w-[180px] rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Complétion</span>
                  <span>{completion}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#06475a] transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection
            icon={<FileText className="h-5 w-5" />}
            title="Identification"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Code" required>
                <input
                  value={form.code}
                  onChange={(event) => updateField('code', event.target.value)}
                  placeholder="Ex : ZONE-1"
                  className={inputClassName}
                />
              </Field>

              <Field label="Libellé" required>
                <input
                  value={form.libelle}
                  onChange={(event) => updateField('libelle', event.target.value)}
                  placeholder="Ex : Zone principale"
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="Description courte du point de structure..."
                rows={3}
                className={textareaClassName}
              />
            </Field>
          </FormSection>

          <FormSection
            icon={<GitFork className="h-5 w-5" />}
            title="Arborescence"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-3 md:grid-cols-2">
                <ChoiceCard
                  active={form.typePoint === 'GEOGRAPHIQUE'}
                  icon={<MapPin className="h-5 w-5" />}
                  title="Point géographique"
                  onClick={() => handleTypePointChange('GEOGRAPHIQUE')}
                />

                <ChoiceCard
                  active={form.typePoint === 'TECHNIQUE'}
                  icon={<GitFork className="h-5 w-5" />}
                  title="Point technique"
                  onClick={() => handleTypePointChange('TECHNIQUE')}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ChoiceCard
                  active={form.typeArborescence === 'GEOGRAPHIQUE'}
                  icon={<MapPin className="h-5 w-5" />}
                  title="Arborescence géographique"
                  onClick={() => handleTypeArborescenceChange('GEOGRAPHIQUE')}
                />

                <ChoiceCard
                  active={form.typeArborescence === 'TECHNIQUE'}
                  disabled={form.typePoint === 'GEOGRAPHIQUE'}
                  icon={<GitFork className="h-5 w-5" />}
                  title="Arborescence technique"
                  onClick={() => handleTypeArborescenceChange('TECHNIQUE')}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Point parent">
               <Select
  value={form.parentPointId || 'NONE'}
  onValueChange={(value: string) =>
    updateField('parentPointId', value === 'NONE' ? '' : value)
  }
  items={[
    {
      label: 'Aucun parent / point racine',
      value: 'NONE',
    },
    ...parents.map((parent) => ({
      value: String(parent.idPoint),
      label: `${parent.code || ''} — ${parent.libelle || ''}`,
    })),
  ]}
/>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {parentsLoading
                    ? 'Chargement des points parents...'
                    : selectedParent
                      ? `Parent : ${
                          selectedParent.code ? `${selectedParent.code} — ` : ''
                        }${selectedParent.libelle ?? ''}`
                      : 'Laissez vide pour créer un point racine.'}
                </p>
              </Field>

              <Field label="Position sous le parent">
                <input
                  type="number"
                  min={1}
                  value={form.ordre}
                  onChange={(event) => updateField('ordre', event.target.value)}
                  placeholder="Ex : 1"
                  className={inputClassName}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={<Building2 className="h-5 w-5" />}
            title="Organisation"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Catégorie">
                <input
                  value={form.categorie}
                  onChange={(event) =>
                    updateField('categorie', event.target.value)
                  }
                  placeholder="Ex : Exploitation, Maintenance..."
                  className={inputClassName}
                />
              </Field>

              <Field label="Responsable">
                <input
                  value={form.responsable}
                  onChange={(event) =>
                    updateField('responsable', event.target.value)
                  }
                  placeholder="Ex : Responsable maintenance"
                  className={inputClassName}
                />
              </Field>

              <Field label="Organisation">
                <input
                  value={form.organisation}
                  onChange={(event) =>
                    updateField('organisation', event.target.value)
                  }
                  placeholder="Ex : Direction technique"
                  className={inputClassName}
                />
              </Field>

              <Field label="Centre de coût">
                <input
                  value={form.centreCout}
                  onChange={(event) =>
                    updateField('centreCout', event.target.value)
                  }
                  placeholder="Ex : CC-MAINT-01"
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ToggleLine
                title="Point actif"
                checked={form.actif}
                onChange={(value) => updateField('actif', value)}
              />

              <Field label="État">
               <Select
  value={form.etat}
  onValueChange={(value: string) =>
    updateField('etat', value as EtatPointValue)
  }
  items={[
    {
      label: 'Brouillon',
      value: 'BROUILLON',
    },
    {
      label: 'Validé',
      value: 'VALIDE',
    },
    {
      label: 'Archivé',
      value: 'ARCHIVE',
    },
  ]}
/>
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Wrench className="h-5 w-5" />} title="Maintenance">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Interventions autorisées">
               <Select
  value={form.interventionsAutorisees ? 'true' : 'false'}
  onValueChange={(value) =>
    updateField('interventionsAutorisees', value === 'true')
  }
  items={[
    { label: 'Oui', value: 'true' },
    { label: 'Non', value: 'false' },
  ]}
/>
              </Field>

              <Field label="Criticité">
                <Select
  value={form.criticite}
  onValueChange={(value) =>
    updateField('criticite', value as CriticiteValue)
  }
  items={[
    { label: 'Faible', value: 'FAIBLE' },
    { label: 'Moyenne', value: 'MOYENNE' },
    { label: 'Élevée', value: 'ELEVEE' },
    { label: 'Critique', value: 'CRITIQUE' },
  ]}
/>
              </Field>
            </div>

            <Field label="Observation maintenance">
              <textarea
                value={form.observationMaintenance}
                onChange={(event) =>
                  updateField('observationMaintenance', event.target.value)
                }
                placeholder="Informations utiles pour les interventions..."
                rows={3}
                className={textareaClassName}
              />
            </Field>
          </FormSection>

          <FormSection icon={<ShieldCheck className="h-5 w-5" />} title="Sécurité">
            <div className="grid gap-4 lg:grid-cols-3">
              <ToggleLine
                title="Zone sensible"
                checked={form.zoneSensible}
                onChange={(value) => updateField('zoneSensible', value)}
              />

              <ToggleLine
                title="Accès restreint"
                checked={form.accesRestreint}
                onChange={(value) => updateField('accesRestreint', value)}
              />

              <ToggleLine
                title="EPI obligatoire"
                checked={form.epiObligatoire}
                onChange={(value) => updateField('epiObligatoire', value)}
              />
            </div>

            <Field label="Consigne de sécurité">
              <textarea
                value={form.consigneSecurite}
                onChange={(event) =>
                  updateField('consigneSecurite', event.target.value)
                }
                placeholder="Ex : Port du casque obligatoire..."
                rows={3}
                className={textareaClassName}
              />
            </Field>
          </FormSection>

          <div className="sticky bottom-4 z-40 flex justify-end">
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-6 text-sm font-bold text-white transition hover:bg-[#043747] disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Enregistrement...' : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
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

      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ChoiceCard({
  active,
  disabled,
  icon,
  title,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex min-h-[64px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
        active
          ? 'border-[#06475a] bg-[#e8f7fb] text-[#06475a] shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-[#06475a]/30 hover:bg-[#f0fafc]',
        disabled ? 'cursor-not-allowed opacity-45 hover:bg-white' : '',
      ].join(' ')}
    >
      <span className="flex items-center gap-3 text-sm font-extrabold">
        <span
          className={[
            'flex h-10 w-10 items-center justify-center rounded-xl',
            active
              ? 'bg-white text-[#06475a]'
              : 'bg-slate-50 text-slate-500',
          ].join(' ')}
        >
          {icon}
        </span>
        {title}
      </span>

      {active && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06475a] text-white">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

function ToggleLine({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left transition',
        checked
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-slate-50 hover:bg-white',
      ].join(' ')}
    >
      <span className="text-sm font-bold text-slate-800">{title}</span>

      <span
        className={[
          'relative h-7 w-12 rounded-full transition',
          checked ? 'bg-emerald-500' : 'bg-slate-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'muted';
}) {
  return (
    <span
      className={[
        'inline-flex h-9 items-center rounded-xl px-4 text-sm font-bold',
        variant === 'success'
          ? 'bg-emerald-50 text-emerald-700'
          : variant === 'muted'
            ? 'bg-slate-100 text-slate-500'
            : 'bg-blue-50 text-blue-700',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

const inputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10';

const selectClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10';

const textareaClassName =
  'w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10';