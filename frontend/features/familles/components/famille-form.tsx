import type { FormEvent, ReactNode } from 'react';
import {
  Archive,
  FileText,
  FolderTree,
  RefreshCcw,
  Save,
  X,
} from 'lucide-react';

import { Select } from '@/components/select';

import type {
  FamilleApi,
  FamilleFormValues,
  NatureAchatFamille,
  TypeFamille,
} from '@/features/familles/types/famille';

type FamilleFormProps = {
  title: string;
  submitLabel: string;

  values: FamilleFormValues;
  familles: FamilleApi[];
  loadingParents: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;

  onCodeChange: (value: string) => void;
  onLibelleChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onActifChange: (value: boolean) => void;
  onNatureAchatChange: (value: NatureAchatFamille | '') => void;
  onTypeFamilleChange: (value: TypeFamille) => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function FamilleForm({
  title,
  submitLabel,
  values,
  familles,
  loadingParents,
  saving,
  error,
  success,
  onCodeChange,
  onLibelleChange,
  onParentChange,
  onActifChange,
  onNatureAchatChange,
  onTypeFamilleChange,
  onSubmit,
  onCancel,
}: FamilleFormProps) {
  const completion = getCompletion(values);

  const parentItems = [
    {
      label: 'Aucune famille parente / famille racine',
      value: 'NONE',
    },
    ...familles.map((famille) => ({
      label: `${famille.code ? `${famille.code} — ` : ''}${
        famille.libelle || 'Sans libellé'
      }`,
      value: String(famille.idFamille),
    })),
  ];

  const typeFamilleItems = [
    { label: 'Équipement', value: 'EQUIPEMENT' },
    { label: 'Article', value: 'ARTICLE' },
    { label: 'Mixte', value: 'MIXTE' },
  ];

  const natureAchatItems = [
    { label: 'Aucune nature', value: 'NONE' },
    { label: 'Électrique', value: 'ELECTRIQUE' },
    { label: 'Mécanique', value: 'MECANIQUE' },
    { label: 'Hydraulique', value: 'HYDRAULIQUE' },
    { label: 'Pneumatique', value: 'PNEUMATIQUE' },
    { label: 'Consommable', value: 'CONSOMMABLE' },
    { label: 'Autre', value: 'AUTRE' },
  ];

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06475a] text-white">
              <FolderTree className="h-7 w-7" />
            </div>

            <div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge>{getTypeFamilleLabel(values.typeFamille)}</Badge>

            <Badge variant={values.actif ? 'success' : 'muted'}>
              {values.actif ? 'Actif' : 'Inactif'}
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

      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          icon={<FileText className="h-5 w-5" />}
          title="Identification"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Code famille" required>
              <input
                value={values.code}
                onChange={(event) => onCodeChange(event.target.value)}
                placeholder="Ex : GE"
                className={inputClassName}
              />
            </Field>

            <Field label="Libellé" required>
              <input
                value={values.libelle}
                onChange={(event) => onLibelleChange(event.target.value)}
                placeholder="Ex : Groupes électrogènes"
                className={inputClassName}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          icon={<FolderTree className="h-5 w-5" />}
          title="Arborescence"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Famille parente">
              <Select
                value={values.parentId || 'NONE'}
                onValueChange={(value: string) =>
                  onParentChange(value === 'NONE' ? '' : value)
                }
                placeholder="Aucune famille parente"
                items={parentItems}
              />

              <p className="mt-2 text-xs font-semibold text-slate-400">
                {loadingParents
                  ? 'Chargement des familles parentes...'
                  : 'Laissez vide pour créer une famille racine.'}
              </p>
            </Field>

            <Field label="Type famille" required>
              <Select
                value={values.typeFamille}
                onValueChange={(value: string) =>
                  onTypeFamilleChange(value as TypeFamille)
                }
                placeholder="Sélectionner un type"
                items={typeFamilleItems}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection icon={<Archive className="h-5 w-5" />} title="Gestion">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <Field label="Statut">
              <ToggleLine
                title="Famille active"
                checked={values.actif}
                onChange={onActifChange}
              />
            </Field>

            <Field label="Nature d’achat">
              <Select
                value={values.natureAchat || 'NONE'}
                onValueChange={(value: string) =>
                  onNatureAchatChange(
                    value === 'NONE' ? '' : (value as NatureAchatFamille),
                  )
                }
                placeholder="Sélectionner une nature"
                items={natureAchatItems}
              />
            </Field>
          </div>
        </FormSection>

        <div className="sticky bottom-4 z-40 flex justify-end">
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
            <button
              type="button"
              onClick={onCancel}
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
    </>
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
    <div>
      <span className="mb-2 block text-sm font-bold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      {children}
    </div>
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
        'flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition',
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

function getCompletion(values: FamilleFormValues) {
  const fields = [
    values.code,
    values.libelle,
    values.parentId,
    values.typeFamille,
    values.actif ? 'actif' : '',
    values.natureAchat,
  ];

  const filled = fields.filter((field) => String(field).trim()).length;

  return Math.round((filled / fields.length) * 100);
}

function getTypeFamilleLabel(typeFamille: TypeFamille) {
  if (typeFamille === 'ARTICLE') return 'Article';
  if (typeFamille === 'MIXTE') return 'Mixte';
  return 'Famille';
}

const inputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10';