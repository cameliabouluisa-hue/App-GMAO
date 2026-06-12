

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { HardDrive, Save, X } from 'lucide-react';
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

import type {
  CreateMaterielDto,
  EtatMateriel,
  Materiel,
  Modele,
  PointStructure,
  TypeMateriel,
  UpdateMaterielDto,
} from '@/features/materiels/types/materiel';

type MaterielFormData = {
  code: string;
  libelle: string;
  numeroSerie: string;

  idModele: string;
  idType: string;
  idEtat: string;
  idPointStructure: string;
  idMaterielParent: string;

  gereEnStock: boolean;
  positionActuelle: string;

  dateMiseService: string;
  dateDernierInventaire: string;
  dateRebut: string;
  motifRebut: string;

  actif: boolean;
};

type Props = {
  mode?: 'create' | 'edit';

  materiel?: Materiel | null;
  initialData?: Materiel | null;

  modeles?: Modele[];
  etats?: EtatMateriel[];
  typesMateriel?: TypeMateriel[];
  types?: TypeMateriel[];
  pointsStructure?: PointStructure[];
  materielsParents?: Materiel[];

  loading?: boolean;
  submitting?: boolean;

  onSubmit: (data: CreateMaterielDto | UpdateMaterielDto) => void | Promise<void>;
  onCancel?: () => void;
};

const POSITION_OPTIONS = [
  { label: 'En stock', value: 'EN_STOCK' },
  { label: 'Sur terrain', value: 'SUR_TERRAIN' },
  { label: 'En atelier', value: 'EN_ATELIER' },
  { label: 'Au rebut', value: 'AU_REBUT' },
];

function toInputDate(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function toNumberOrNull(value: string) {
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function buildInitialForm(materiel?: Materiel | null): MaterielFormData {
  return {
    code: materiel?.code ?? '',
    libelle: materiel?.libelle ?? '',
    numeroSerie: materiel?.numeroSerie ?? '',

    idModele: materiel?.idModele ? String(materiel.idModele) : '',
    idType: materiel?.idType ? String(materiel.idType) : '',
    idEtat: materiel?.idEtat ? String(materiel.idEtat) : '',
    idPointStructure: materiel?.idPointStructure
      ? String(materiel.idPointStructure)
      : '',
    idMaterielParent: materiel?.idMaterielParent
      ? String(materiel.idMaterielParent)
      : '',

    gereEnStock: materiel?.gereEnStock ?? false,
    positionActuelle: materiel?.positionActuelle ?? 'SUR_TERRAIN',

    dateMiseService: toInputDate(materiel?.dateMiseService),
    dateDernierInventaire: toInputDate(materiel?.dateDernierInventaire),
    dateRebut: toInputDate(materiel?.dateRebut),
    motifRebut: materiel?.motifRebut ?? '',

    actif: materiel?.actif !== false,
  };
}

function getModeleLabel(modele: Modele) {
  return modele.libelle || modele.code || `MOD-${modele.idModele}`;
}

function getPointStructureLabel(point: PointStructure) {
  return point.libelle || point.code || `PS-${point.idPoint}`;
}

function getParentMaterielLabel(materiel: Materiel) {
  return materiel.libelle || materiel.code || `MAT-${materiel.idMateriel}`;
}

export default function MaterielForm({
  mode,
  materiel,
  initialData,
  modeles = [],
  etats = [],
  typesMateriel,
  types,
  pointsStructure = [],
  materielsParents = [],
  loading = false,
  submitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const currentMateriel = initialData ?? materiel ?? null;

  const isEdit = mode ? mode === 'edit' : Boolean(currentMateriel);

  const [form, setForm] = useState<MaterielFormData>(() =>
    buildInitialForm(currentMateriel),
  );

  const [error, setError] = useState('');

  const typeOptions = typesMateriel ?? types ?? [];

  useEffect(() => {
    setForm(buildInitialForm(currentMateriel));
  }, [currentMateriel]);

  const filteredParentMateriels = useMemo(() => {
    return materielsParents.filter(
      (item) => item.idMateriel !== currentMateriel?.idMateriel,
    );
  }, [materielsParents, currentMateriel?.idMateriel]);

  function updateField<K extends keyof MaterielFormData>(
    key: K,
    value: MaterielFormData[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = form.code.trim();
    const libelle = form.libelle.trim();

    if (!code) {
      setError('Le code du matériel est obligatoire.');
      return;
    }

    if (!libelle) {
      setError('Le libellé du matériel est obligatoire.');
      return;
    }

    setError('');

    const payload: CreateMaterielDto | UpdateMaterielDto = {
      code,
      libelle,
      numeroSerie: form.numeroSerie.trim() || null,

      idModele: toNumberOrNull(form.idModele),
      idType: toNumberOrNull(form.idType),
      idEtat: toNumberOrNull(form.idEtat),
      idPointStructure: toNumberOrNull(form.idPointStructure),
      idMaterielParent: toNumberOrNull(form.idMaterielParent),

      gereEnStock: form.gereEnStock,
      positionActuelle: form.positionActuelle || null,

      dateMiseService: form.dateMiseService || null,
      dateDernierInventaire: form.dateDernierInventaire || null,
      dateRebut: form.dateRebut || null,
      motifRebut: form.motifRebut.trim() || null,

      actif: form.actif,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#06475a] to-[#0b5d73] px-6 py-5 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <HardDrive size={29} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
                  {isEdit ? 'Modification matériel' : 'Nouveau matériel'}
                </p>

                <h1 className="mt-1 min-w-0 break-words text-3xl font-black tracking-tight">
                  {isEdit
                    ? currentMateriel?.code || 'Modifier le matériel'
                    : 'Créer un matériel'}
                </h1>

                <p className="mt-2 min-w-0 break-words text-sm font-semibold text-white/75">
                  {isEdit
                    ? 'Modifiez les informations du matériel sélectionné.'
                    : 'Renseignez les informations nécessaires pour ajouter un matériel au parc.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={submitting || loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={16} />
                  Annuler
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0b3d4f] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
              {error}
            </div>
          )}

          <AppSection title="Généralités">
            <AppFieldGrid>
              <AppFormField label="Code" required>
                <input
                  value={form.code}
                  onChange={(event) => updateField('code', event.target.value)}
                  className={appInputClassName}
                  placeholder="Ex : STS-01"
                />
              </AppFormField>

              <AppFormField label="Libellé" required>
                <input
                  value={form.libelle}
                  onChange={(event) => updateField('libelle', event.target.value)}
                  className={appInputClassName}
                  placeholder="Ex : Portique de quai STS 01"
                />
              </AppFormField>

              <AppFormField label="N° de série">
                <input
                  value={form.numeroSerie}
                  onChange={(event) =>
                    updateField('numeroSerie', event.target.value)
                  }
                  className={appInputClassName}
                  placeholder="Ex : SN-BMT-STS-001"
                />
              </AppFormField>

             <AppFormField label="Actif">
  <Select
    value={form.actif ? 'true' : 'false'}
    onValueChange={(value: string) =>
      updateField('actif', value === 'true')
    }
    items={[
      { label: 'Actif', value: 'true' },
      { label: 'Inactif', value: 'false' },
    ]}
  />
</AppFormField>
            </AppFieldGrid>
          </AppSection>

          <AppSection title="Référentiel technique">
            <AppFieldGrid>
              <AppFormField label="Modèle">
  <Select
    value={form.idModele || 'NONE_MODELE'}
    onValueChange={(value: string) =>
      updateField('idModele', value === 'NONE_MODELE' ? '' : value)
    }
    items={[
      { label: 'Aucun modèle', value: 'NONE_MODELE' },
      ...modeles.map((modele) => ({
        label: getModeleLabel(modele),
        value: String(modele.idModele),
      })),
    ]}
  />
</AppFormField>

             <AppFormField label="Type de matériel">
  <Select
    value={form.idType || 'NONE_TYPE'}
    onValueChange={(value: string) =>
      updateField('idType', value === 'NONE_TYPE' ? '' : value)
    }
    items={[
      { label: 'Aucun type', value: 'NONE_TYPE' },
      ...typeOptions.map((type) => ({
        label: type.libelle || `Type ${type.idType}`,
        value: String(type.idType),
      })),
    ]}
  />
</AppFormField>

             <AppFormField label="État">
  <Select
    value={form.idEtat || 'NONE_ETAT'}
    onValueChange={(value: string) =>
      updateField('idEtat', value === 'NONE_ETAT' ? '' : value)
    }
    items={[
      { label: 'Aucun état', value: 'NONE_ETAT' },
      ...etats.map((etat) => ({
        label: etat.libelle || etat.code || `État ${etat.idEtat}`,
        value: String(etat.idEtat),
      })),
    ]}
  />
</AppFormField>

              <AppFormField label="Géré en stock">
  <Select
    value={form.gereEnStock ? 'true' : 'false'}
    onValueChange={(value: string) =>
      updateField('gereEnStock', value === 'true')
    }
    items={[
      { label: 'Non', value: 'false' },
      { label: 'Oui', value: 'true' },
    ]}
  />
</AppFormField>
            </AppFieldGrid>
          </AppSection>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <AppSection title="Affectation">
              <AppFieldGrid>
               <AppFormField label="Père géographique">
  <Select
    value={form.idPointStructure || 'NONE_POINT'}
    onValueChange={(value: string) =>
      updateField('idPointStructure', value === 'NONE_POINT' ? '' : value)
    }
    items={[
      { label: 'Aucun point de structure', value: 'NONE_POINT' },
      ...pointsStructure.map((point) => ({
        label: getPointStructureLabel(point),
        value: String(point.idPoint),
      })),
    ]}
  />
</AppFormField>

               <AppFormField label="Père matériel">
  <Select
    value={form.idMaterielParent || 'NONE_PARENT'}
    onValueChange={(value: string) =>
      updateField('idMaterielParent', value === 'NONE_PARENT' ? '' : value)
    }
    items={[
      { label: 'Aucun père matériel', value: 'NONE_PARENT' },
      ...filteredParentMateriels.map((parent) => ({
        label: getParentMaterielLabel(parent),
        value: String(parent.idMateriel),
      })),
    ]}
  />
</AppFormField>

              <AppFormField label="Position actuelle">
  <Select
    value={form.positionActuelle || 'SUR_TERRAIN'}
    onValueChange={(value: string) =>
      updateField('positionActuelle', value)
    }
    items={POSITION_OPTIONS}
  />
</AppFormField>
              </AppFieldGrid>
            </AppSection>

            <AppSection title="Cycle de vie">
              <div className="min-w-0">
                <AppFormField label="Mise en service">
                  <input
                    type="date"
                    value={form.dateMiseService}
                    onChange={(event) =>
                      updateField('dateMiseService', event.target.value)
                    }
                    className={appInputClassName}
                  />
                </AppFormField>

                <AppFormField label="Dernier inventaire">
                  <input
                    type="date"
                    value={form.dateDernierInventaire}
                    onChange={(event) =>
                      updateField('dateDernierInventaire', event.target.value)
                    }
                    className={appInputClassName}
                  />
                </AppFormField>

                <AppFormField label="Date rebut">
                  <input
                    type="date"
                    value={form.dateRebut}
                    onChange={(event) =>
                      updateField('dateRebut', event.target.value)
                    }
                    className={appInputClassName}
                  />
                </AppFormField>

                <AppFormField label="Motif rebut">
                  <textarea
                    value={form.motifRebut}
                    onChange={(event) =>
                      updateField('motifRebut', event.target.value)
                    }
                    className={appTextareaClassName}
                    placeholder="Motif de mise au rebut..."
                  />
                </AppFormField>
              </div>
            </AppSection>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting || loading}
                className={appSecondaryButtonClassName}
              >
                <X size={16} />
                Annuler
              </button>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className={appPrimaryButtonClassName}
            >
              <Save size={16} />
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}