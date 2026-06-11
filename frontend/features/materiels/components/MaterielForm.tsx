

import { Select } from '@/components/select';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  Activity,
  ArrowLeft,
  Calendar,
  FileText,
  HardDrive,
  MapPin,
  Package,
  RefreshCcw,
  Save,
  Settings,
  X,
} from 'lucide-react';

import {
  getEtatsMateriel,
  getMateriel,
  getMateriels,
  getModeles,
  getPointsStructure,
  getTypesMateriel,
} from '../services/materiel.service';

import type {
  CreateMaterielDto,
  EtatMateriel,
  Materiel,
  Modele,
  PointStructure,
  TypeMateriel,
  UpdateMaterielDto,
} from '../types/materiel';

type Mode = 'create' | 'edit';

type PositionMaterielValue =
  | 'EN_STOCK'
  | 'SUR_TERRAIN'
  | 'EN_ATELIER'
  | 'AU_REBUT';

type FormState = {
  code: string;
  libelle: string;
  numeroSerie: string;

  idModele: string;
  idEtat: string;
  idType: string;
  idPointStructure: string;
  idMaterielParent: string;

  dateMiseService: string;
  dateDernierInventaire: string;
  dateRebut: string;
  motifRebut: string;

  gereEnStock: boolean;
  positionActuelle: PositionMaterielValue;

  actif: boolean;
};

type Props = {
  mode: Mode;
  initialData?: Materiel | null;
  onSubmit: (data: CreateMaterielDto | UpdateMaterielDto) => Promise<void>;
};

const DEFAULT_FORM: FormState = {
  code: '',
  libelle: '',
  numeroSerie: '',

  idModele: '',
  idEtat: '',
  idType: '',
  idPointStructure: '',
  idMaterielParent: '',

  dateMiseService: '',
  dateDernierInventaire: '',
  dateRebut: '',
  motifRebut: '',

  gereEnStock: false,
  positionActuelle: 'SUR_TERRAIN',

  actif: true,
};

const POSITION_ITEMS: { label: string; value: PositionMaterielValue }[] = [
  { label: 'En stock', value: 'EN_STOCK' },
  { label: 'Sur terrain', value: 'SUR_TERRAIN' },
  { label: 'En atelier', value: 'EN_ATELIER' },
  { label: 'Au rebut', value: 'AU_REBUT' },
];

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableNumber(value: string): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildInitialForm(initialData?: Materiel | null): FormState {
  if (!initialData) return DEFAULT_FORM;

  return {
    code: toInputValue(initialData.code),
    libelle: toInputValue(initialData.libelle),
    numeroSerie: toInputValue(initialData.numeroSerie),

    idModele: initialData.idModele ? String(initialData.idModele) : '',
    idEtat: initialData.idEtat ? String(initialData.idEtat) : '',
    idType: initialData.idType ? String(initialData.idType) : '',
    idPointStructure: initialData.idPointStructure
      ? String(initialData.idPointStructure)
      : '',
    idMaterielParent: initialData.idMaterielParent
      ? String(initialData.idMaterielParent)
      : '',

    dateMiseService: toDateInput(initialData.dateMiseService),
    dateDernierInventaire: toDateInput(initialData.dateDernierInventaire),
    dateRebut: toDateInput(initialData.dateRebut),
    motifRebut: toInputValue(initialData.motifRebut),

    gereEnStock: initialData.gereEnStock ?? false,
    positionActuelle:
      (initialData.positionActuelle as PositionMaterielValue | null) ??
      'SUR_TERRAIN',

    actif: initialData.actif ?? true,
  };
}

function getPositionLabel(position: PositionMaterielValue): string {
  const found = POSITION_ITEMS.find((item) => item.value === position);
  return found?.label ?? position;
}

function getEtatCode(etat: EtatMateriel | null): string {
  return etat?.code ?? '';
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error as {
      response?: {
        data?: {
          message?: string | string[];
          error?: string;
        };
      };
    };

    const message = response.response?.data?.message;

    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;

    if (response.response?.data?.error) return response.response.data.error;
  }

  if (error instanceof Error) return error.message;

  return 'Une erreur est survenue lors de l’enregistrement.';
}

function formatModeleLabel(modele: Modele): string {
  const code = modele.code?.trim();
  const libelle = modele.libelle?.trim();

  if (code && libelle) return `${code} — ${libelle}`;
  if (libelle) return libelle;
  if (code) return code;

  return `Modèle ${modele.idModele}`;
}

function formatMaterielLabel(materiel: Materiel): string {
  const code = materiel.code?.trim();
  const libelle = materiel.libelle?.trim();

  if (code && libelle) return `${code} — ${libelle}`;
  if (libelle) return libelle;
  if (code) return code;

  return `Matériel ${materiel.idMateriel}`;
}

function formatPointLabel(point: PointStructure): string {
  const code = point.code?.trim();
  const libelle = point.libelle?.trim();

  if (code && libelle) return `${code} — ${libelle}`;
  if (libelle) return libelle;
  if (code) return code;

  return `Point ${point.idPoint}`;
}

export function MaterielForm({ mode, initialData, onSubmit }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(initialData),
  );

  const [modeles, setModeles] = useState<Modele[]>([]);
  const [etats, setEtats] = useState<EtatMateriel[]>([]);
  const [types, setTypes] = useState<TypeMateriel[]>([]);
  const [pointsStructure, setPointsStructure] = useState<PointStructure[]>([]);
  const [materielsParents, setMaterielsParents] = useState<Materiel[]>([]);

  const [referentielLoading, setReferentielLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Modifier le matériel' : 'Nouveau matériel';
  const submitLabel = isEditMode ? 'Enregistrer' : 'Créer le matériel';

  const selectedModele = useMemo(() => {
    if (!form.idModele) return null;
    return modeles.find((modele) => String(modele.idModele) === form.idModele);
  }, [form.idModele, modeles]);

  const selectedEtat = useMemo(() => {
    if (!form.idEtat) return null;
    return etats.find((etat) => String(etat.idEtat) === form.idEtat) ?? null;
  }, [form.idEtat, etats]);

  const selectedEtatCode = getEtatCode(selectedEtat);

  const availableParents = useMemo(() => {
    return materielsParents.filter(
      (materiel) => materiel.idMateriel !== initialData?.idMateriel,
    );
  }, [initialData?.idMateriel, materielsParents]);

  const completion = useMemo(() => {
    const fields = [
      form.code,
      form.libelle,
      form.numeroSerie,
      form.idModele,
      form.idEtat,
      form.idType,
      form.positionActuelle,
      form.dateMiseService,
    ];

    const filled = fields.filter((field) => String(field).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  useEffect(() => {
    setForm(buildInitialForm(initialData));
  }, [initialData]);

  useEffect(() => {
    async function loadReferentiel() {
      try {
        setReferentielLoading(true);

        const [
          modelesData,
          etatsData,
          typesData,
          pointsData,
          materielsData,
        ] = await Promise.all([
          getModeles(),
          getEtatsMateriel(),
          getTypesMateriel(),
          getPointsStructure(),
          getMateriels(),
        ]);

        setModeles(modelesData);
        setEtats(etatsData);
        setTypes(typesData);
        setPointsStructure(pointsData);
        setMaterielsParents(materielsData);

        if (!initialData) {
          const etatPreparation = etatsData.find(
            (etat) => etat.code === 'EN_PREPARATION',
          );

          if (etatPreparation) {
            setForm((previous) => ({
              ...previous,
              idEtat: previous.idEtat || String(etatPreparation.idEtat),
            }));
          }
        }
      } finally {
        setReferentielLoading(false);
      }
    }

    loadReferentiel();
  }, [initialData]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleGereEnStockChange(value: boolean) {
    setForm((previous) => ({
      ...previous,
      gereEnStock: value,
      dateDernierInventaire: value ? '' : previous.dateDernierInventaire,
      positionActuelle: value ? 'EN_STOCK' : 'SUR_TERRAIN',
    }));
  }

  function handleEtatChange(value: string) {
    const nextValue = value === 'NONE' ? '' : value;
    const nextEtat = etats.find((etat) => String(etat.idEtat) === nextValue);
    const nextCode = nextEtat?.code;

    setForm((previous) => ({
      ...previous,
      idEtat: nextValue,
      positionActuelle:
        nextCode === 'AU_REBUT' ? 'AU_REBUT' : previous.positionActuelle,
      dateRebut:
        nextCode === 'AU_REBUT'
          ? previous.dateRebut || new Date().toISOString().slice(0, 10)
          : previous.dateRebut,
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

    if (!form.idEtat) {
      setError('L’état du matériel est obligatoire.');
      return;
    }

    if (form.gereEnStock && form.positionActuelle !== 'EN_STOCK') {
      setError('Un matériel géré en stock doit avoir la position "En stock".');
      return;
    }

    if (selectedEtatCode === 'AU_REBUT' && !form.motifRebut.trim()) {
      setError('Le motif de rebut est obligatoire lorsque le matériel est au rebut.');
      return;
    }

    const payload: CreateMaterielDto | UpdateMaterielDto = {
      code: form.code.trim(),
      libelle: form.libelle.trim(),
      numeroSerie: nullableText(form.numeroSerie),

      dateMiseService: form.dateMiseService || null,
      dateRebut: form.dateRebut || null,
      motifRebut: nullableText(form.motifRebut),

      gereEnStock: form.gereEnStock,
      positionActuelle: form.positionActuelle,

      idModele: nullableNumber(form.idModele),
      idEtat: nullableNumber(form.idEtat),
      idType: nullableNumber(form.idType),
      idPointStructure: nullableNumber(form.idPointStructure),
      idMaterielParent: nullableNumber(form.idMaterielParent),

      actif: form.actif,
    };

    if (!form.gereEnStock) {
      payload.dateDernierInventaire = form.dateDernierInventaire || null;
    }

    try {
      setSaving(true);
      await onSubmit(payload);
      router.push('/materiels');
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
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
                <HardDrive className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-400">
                  Module équipements
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                  {title}
                </h1>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Renseignez l’identification, le cycle de vie et l’affectation
                  du matériel.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge>
                {selectedEtat?.libelle || selectedEtat?.code || 'Sans état'}
              </Badge>

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
                  placeholder="Ex : MA-000164"
                  className={inputClassName}
                />
              </Field>

              <Field label="Libellé" required>
                <input
                  value={form.libelle}
                  onChange={(event) =>
                    updateField('libelle', event.target.value)
                  }
                  placeholder="Ex : Moteur principal RTG"
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field label="Numéro de série">
              <input
                value={form.numeroSerie}
                onChange={(event) =>
                  updateField('numeroSerie', event.target.value)
                }
                placeholder="Ex : SN-RTG-2026-001"
                className={inputClassName}
              />
            </Field>
          </FormSection>

          <FormSection
            icon={<Settings className="h-5 w-5" />}
            title="Référentiel technique"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Modèle">
                <Select
                  value={form.idModele || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField('idModele', value === 'NONE' ? '' : value)
                  }
                  items={[
                    { label: 'Aucun modèle', value: 'NONE' },
                    ...modeles.map((modele) => ({
                      value: String(modele.idModele),
                      label: formatModeleLabel(modele),
                    })),
                  ]}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {referentielLoading
                    ? 'Chargement des modèles...'
                    : selectedModele
                      ? `Modèle sélectionné : ${formatModeleLabel(
                          selectedModele,
                        )}`
                      : 'Le modèle permet de rattacher le matériel à une fiche type.'}
                </p>
              </Field>

              <Field label="Type de matériel">
                <Select
                  value={form.idType || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField('idType', value === 'NONE' ? '' : value)
                  }
                  items={[
                    { label: 'Aucun type', value: 'NONE' },
                    ...types.map((type) => ({
                      value: String(type.idType),
                      label: type.libelle || `Type ${type.idType}`,
                    })),
                  ]}
                />
              </Field>

              <Field label="État" required>
                <Select
                  value={form.idEtat || 'NONE'}
                  onValueChange={handleEtatChange}
                  items={[
                    { label: 'Sélectionner un état', value: 'NONE' },
                    ...etats.map((etat) => ({
                      value: String(etat.idEtat),
                      label: etat.code
                        ? `${etat.code} — ${etat.libelle || ''}`
                        : etat.libelle || `État ${etat.idEtat}`,
                    })),
                  ]}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Par défaut, un nouveau matériel est généralement créé en
                  préparation.
                </p>
              </Field>

              <Field label="Actif">
                <ToggleLine
                  title={form.actif ? 'Matériel actif' : 'Matériel inactif'}
                  checked={form.actif}
                  onChange={(value) => updateField('actif', value)}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={<Calendar className="h-5 w-5" />}
            title="Cycle de vie"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Date de mise en service">
                <input
                  type="date"
                  value={form.dateMiseService}
                  onChange={(event) =>
                    updateField('dateMiseService', event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>

              <Field label="Dernier inventaire">
                <input
                  type="date"
                  value={form.dateDernierInventaire}
                  disabled={form.gereEnStock}
                  onChange={(event) =>
                    updateField('dateDernierInventaire', event.target.value)
                  }
                  className={[
                    inputClassName,
                    form.gereEnStock
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : '',
                  ].join(' ')}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {form.gereEnStock
                    ? 'Ce champ est alimenté depuis le module stock.'
                    : 'Ce matériel n’est pas géré en stock : l’admin peut modifier cette date.'}
                </p>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Gestion stock">
                <ToggleLine
                  title={
                    form.gereEnStock
                      ? 'Inventaire géré par le stock'
                      : 'Inventaire manuel dans la fiche matériel'
                  }
                  checked={form.gereEnStock}
                  onChange={handleGereEnStockChange}
                />
              </Field>

              <Field label="Position actuelle">
                <Select
                  value={form.positionActuelle}
                  onValueChange={(value: string) =>
                    updateField(
                      'positionActuelle',
                      value as PositionMaterielValue,
                    )
                  }
                  items={POSITION_ITEMS}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Situation actuelle : {getPositionLabel(form.positionActuelle)}
                </p>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Date de rebut">
                <input
                  type="date"
                  value={form.dateRebut}
                  onChange={(event) =>
                    updateField('dateRebut', event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>

              <Field
                label={
                  selectedEtatCode === 'AU_REBUT'
                    ? 'Motif de rebut'
                    : 'Motif / commentaire cycle de vie'
                }
                required={selectedEtatCode === 'AU_REBUT'}
              >
                <textarea
                  value={form.motifRebut}
                  onChange={(event) =>
                    updateField('motifRebut', event.target.value)
                  }
                  rows={3}
                  placeholder="Ex : Matériel irréparable, remplacement validé..."
                  className={textareaClassName}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<MapPin className="h-5 w-5" />} title="Affectation">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Point de structure">
                <Select
                  value={form.idPointStructure || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField(
                      'idPointStructure',
                      value === 'NONE' ? '' : value,
                    )
                  }
                  items={[
                    { label: 'Aucun point de structure', value: 'NONE' },
                    ...pointsStructure.map((point) => ({
                      value: String(point.idPoint),
                      label: formatPointLabel(point),
                    })),
                  ]}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Pour un matériel sur terrain, indiquez sa localisation dans le
                  parc équipements.
                </p>
              </Field>

              <Field label="Matériel parent">
                <Select
                  value={form.idMaterielParent || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField(
                      'idMaterielParent',
                      value === 'NONE' ? '' : value,
                    )
                  }
                  items={[
                    { label: 'Aucun matériel parent', value: 'NONE' },
                    ...availableParents.map((materiel) => ({
                      value: String(materiel.idMateriel),
                      label: formatMaterielLabel(materiel),
                    })),
                  ]}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Sert à construire une arborescence technique entre matériels.
                </p>
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Activity className="h-5 w-5" />} title="Synthèse">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                label="Modèle"
                value={
                  selectedModele
                    ? selectedModele.libelle || selectedModele.code || '—'
                    : 'Non renseigné'
                }
              />

              <InfoCard
                label="État"
                value={
                  selectedEtat
                    ? selectedEtat.libelle || selectedEtat.code || '—'
                    : 'Non renseigné'
                }
              />

              <InfoCard
                label="Gestion stock"
                value={form.gereEnStock ? 'Oui' : 'Non'}
              />
            </div>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#06475a] focus:ring-4 focus:ring-[#06475a]/10';

const textareaClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#06475a] focus:ring-4 focus:ring-[#06475a]/10';