

import { Select } from '@/components/select';
import {
  AppFieldGrid,
  AppFormField,
  AppSection,
  appInputClassName,
  appPrimaryButtonClassName,
  appSecondaryButtonClassName,
  appTextareaClassName,
} from '@/components/app-section-layout';
import { AlertTriangle, FileText, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  CreateDemandeInterventionDto,
  DemandeIntervention,
} from '../types/demande-intervention.types';

type MaterielOption = {
  idMateriel: number;
  code?: string | null;
  libelle?: string | null;
  numeroSerie?: string | null;
  
};

type Props = {
  materiels: MaterielOption[];
  initialData?: Partial<DemandeIntervention>;
  submitting?: boolean;
  error?: string;
  submitLabel?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  cancelHref?: string;
  onSubmit: (data: CreateDemandeInterventionDto) => Promise<void>;
};

type FormState = {
  code: string;
  dateDemande: string;
  description: string;
  idMateriel: string;
  demandeur: string;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  criticite: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';
  receptionTravaux: boolean;
  materielEnPanne: boolean;
  materielIndisponible: boolean;
};

export function DemandeInterventionForm({
  materiels,
  initialData,
  submitting = false,
  error = '',
  submitLabel = 'Enregistrer',
  title = 'Créer une demande d’intervention',
  subtitle = 'Renseignez les informations nécessaires pour signaler un besoin de maintenance.',
  eyebrow = 'Nouvelle demande',
  cancelHref = '/maintenance/demandes',
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormState>({
    code: initialData?.code || '',
    dateDemande: toDateTimeLocal(initialData?.dateDemande),
    description: initialData?.description || '',
    idMateriel: initialData?.idMateriel
      ? String(initialData.idMateriel)
      : 'none',
    demandeur: initialData?.demandeur || '',
    priorite:
      (initialData?.priorite as FormState['priorite']) || 'NORMALE',
    criticite:
      (initialData?.criticite as FormState['criticite']) || 'MOYENNE',
    receptionTravaux: initialData?.receptionTravaux ?? false,
    materielEnPanne: initialData?.materielEnPanne ?? false,
    materielIndisponible: initialData?.materielIndisponible ?? false,
  });

  const materielItems = useMemo(() => {
    return [
      { label: 'Aucun matériel sélectionné', value: 'none' },
      ...materiels.map((materiel) => ({
        value: String(materiel.idMateriel),
        label: formatMaterielOption(materiel),
      })),
    ];
  }, [materiels]);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateDemandeInterventionDto = {
      code: form.code.trim() || undefined,
      dateDemande: form.dateDemande
        ? new Date(form.dateDemande).toISOString()
        : undefined,
      description: form.description.trim(),
      idMateriel:
        form.idMateriel && form.idMateriel !== 'none'
          ? Number(form.idMateriel)
          : null,
      demandeur: form.demandeur.trim() || undefined,
      priorite: form.priorite,
      criticite: form.criticite,
      receptionTravaux: form.receptionTravaux,
      materielEnPanne: form.materielEnPanne,
      materielIndisponible: form.materielIndisponible,
    };

    await onSubmit(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-5 bg-[#07576b] px-7 py-6 text-white md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <FileText size={28} />
          </div>

          <div>
           <p className="text-xs font-black uppercase tracking-[0.35em] text-white/60">
  {eyebrow}
</p>

<h1 className="mt-1 text-3xl font-black">{title}</h1>

<p className="mt-2 text-sm font-bold text-white/80">
  {subtitle}
</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={cancelHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 text-sm font-black text-white transition hover:bg-white/20"
          >
            <X size={18} />
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#06475a] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {submitting ? 'Enregistrement...' : submitLabel}
          </button>
        </div>
      </div>

      <div className="space-y-6 px-7 py-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AppSection title="Généralités">
          <AppFieldGrid>
            <AppFormField label="Code">
              <input
                value={form.code}
                onChange={(event) =>
                  updateField('code', event.target.value)
                }
                placeholder="Ex : DI-0001"
                className={appInputClassName}
              />
            </AppFormField>

            <AppFormField label="Date demande">
              <input
                type="datetime-local"
                value={form.dateDemande}
                onChange={(event) =>
                  updateField('dateDemande', event.target.value)
                }
                className={appInputClassName}
              />
            </AppFormField>

            <AppFormField label="Demandeur">
              <input
                value={form.demandeur}
                onChange={(event) =>
                  updateField('demandeur', event.target.value)
                }
                placeholder="Ex : Camelia"
                className={appInputClassName}
              />
            </AppFormField>

            <AppFormField label="Matériel concerné">
              <Select
                value={form.idMateriel}
                onValueChange={(value: string) =>
                  updateField('idMateriel', value)
                }
                items={materielItems}
              />
            </AppFormField>
          </AppFieldGrid>

          <AppFormField
            label="Description"
            required
            help="Décrivez clairement la panne, l’anomalie ou le besoin signalé."
          >
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              required
              placeholder="Ex : Fuite hydraulique détectée sur le Reach Stacker..."
              className={appTextareaClassName}
            />
          </AppFormField>
        </AppSection>

        <AppSection title="Priorité et criticité">
          <AppFieldGrid>
            <AppFormField label="Priorité">
              <Select
                value={form.priorite}
                onValueChange={(value: string) =>
                  updateField('priorite', value as FormState['priorite'])
                }
                items={[
                  { label: 'Basse', value: 'BASSE' },
                  { label: 'Normale', value: 'NORMALE' },
                  { label: 'Haute', value: 'HAUTE' },
                  { label: 'Urgente', value: 'URGENTE' },
                ]}
              />
            </AppFormField>

            <AppFormField label="Criticité">
              <Select
                value={form.criticite}
                onValueChange={(value: string) =>
                  updateField(
                    'criticite',
                    value as FormState['criticite'],
                  )
                }
                items={[
                  { label: 'Faible', value: 'FAIBLE' },
                  { label: 'Moyenne', value: 'MOYENNE' },
                  { label: 'Élevée', value: 'ELEVEE' },
                  { label: 'Critique', value: 'CRITIQUE' },
                ]}
              />
            </AppFormField>
          </AppFieldGrid>
        </AppSection>

        <AppSection title="Impact sur le matériel">
          <div className="grid gap-3 md:grid-cols-3">
            <BooleanCard
              title="Matériel en panne"
              description="Indique que le matériel présente une panne."
              checked={form.materielEnPanne}
              onChange={(checked) =>
                updateField('materielEnPanne', checked)
              }
            />

            <BooleanCard
              title="Matériel indisponible"
              description="Indique que le matériel ne peut plus être utilisé."
              checked={form.materielIndisponible}
              onChange={(checked) =>
                updateField('materielIndisponible', checked)
              }
            />

            <BooleanCard
              title="Réception travaux"
              description="Demande un contrôle ou une réception après travaux."
              checked={form.receptionTravaux}
              onChange={(checked) =>
                updateField('receptionTravaux', checked)
              }
            />
          </div>
        </AppSection>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/maintenance/demandes"
            className={appSecondaryButtonClassName}
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className={appPrimaryButtonClassName}
          >
            <Save size={18} />
            {submitting ? 'Enregistrement...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function BooleanCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? 'border-[#06475a] bg-[#e8f7fb] ring-4 ring-[#06475a]/10'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-900">{title}</p>

        <span
          className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
            checked ? 'bg-[#06475a]' : 'bg-slate-200'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

function formatMaterielOption(materiel: MaterielOption) {
  const code = materiel.code || `MAT-${materiel.idMateriel}`;
  const libelle = materiel.libelle || 'Sans libellé';

  return `${code} — ${libelle}`;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}