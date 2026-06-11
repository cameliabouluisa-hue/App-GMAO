

import { Select } from '@/components/select';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Check,
  Coins,
  FileText,
  PackageCheck,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  Tags,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';

import {
  Article,
  CreateArticleDto,
  Famille,
  Magasin,
  UniteArticle,
} from '../types/article';

import {
  getFamilles,
  getMagasins,
  getUnitesArticles,
} from '../services/article-referentiel.service';

type Props = {
  initialData?: Article;
  onSubmit: (data: CreateArticleDto) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

type CategorieArticleValue =
  | 'PIECE_RECHANGE'
  | 'CONSOMMABLE'
  | 'FOURNITURE'
  | 'OUTILLAGE'
  | 'EQUIPEMENT_STOCKE'
  | 'SERVICE'
  | 'AUTRE';

type EtatArticleValue = 'ACTIF' | 'INACTIF';

type MaterielInitialForm = {
  code: string;
  numeroSerie: string;
  libelle: string;
};

type FormState = {
  reference: string;
  designation: string;

  etatArticle: EtatArticleValue;
  categorie: CategorieArticleValue;
  idFamille: string;

  fournisseurPrincipal: string;
  fabricantArticle: string;
  referenceFabricant: string;

  idUniteArticle: string;
  nbDecimales: string;
  codeBarres: string;

  centreCout: string;
  budget: string;
  codeComptable: string;
  natureAchat: string;
  taxe: string;
  prixStandard: string;
  prixMoyenPondere: string;

  gereEnStock: boolean;
  gereParLot: boolean;
  serialise: boolean;
  estModele: boolean;

  useStockInitial: boolean;
  stockIdMagasin: string;
  stockQuantite: string;
  stockPrixUnitaire: string;
  stockNumeroLot: string;
  stockDatePeremption: string;
  stockObservation: string;
  stockMateriels: MaterielInitialForm[];
};

const DEFAULT_FORM: FormState = {
  reference: '',
  designation: '',

  etatArticle: 'ACTIF',
  categorie: 'PIECE_RECHANGE',
  idFamille: '',

  fournisseurPrincipal: '',
  fabricantArticle: '',
  referenceFabricant: '',

  idUniteArticle: '',
  nbDecimales: '0',
  codeBarres: '',

  centreCout: '',
  budget: '',
  codeComptable: '',
  natureAchat: '',
  taxe: '',
  prixStandard: '',
  prixMoyenPondere: '',

  gereEnStock: true,
  gereParLot: false,
  serialise: false,
  estModele: false,

  useStockInitial: false,
  stockIdMagasin: '',
  stockQuantite: '',
  stockPrixUnitaire: '',
  stockNumeroLot: '',
  stockDatePeremption: '',
  stockObservation: '',
  stockMateriels: [],
};

const CATEGORIE_OPTIONS: Array<{
  label: string;
  value: CategorieArticleValue;
}> = [
  { label: 'Pièce de rechange', value: 'PIECE_RECHANGE' },
  { label: 'Consommable', value: 'CONSOMMABLE' },
  { label: 'Fourniture', value: 'FOURNITURE' },
  { label: 'Outillage', value: 'OUTILLAGE' },
  { label: 'Équipement stocké', value: 'EQUIPEMENT_STOCKE' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Autre', value: 'AUTRE' },
];

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function nullableText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const number = Number(trimmed);
  return Number.isNaN(number) ? undefined : number;
}

function optionalInteger(value: string): number | undefined {
  const number = optionalNumber(value);

  if (number === undefined) return undefined;

  return Math.trunc(number);
}

function buildInitialForm(initialData?: Article): FormState {
  if (!initialData) return DEFAULT_FORM;

  return {
    ...DEFAULT_FORM,

    reference: toInputValue(initialData.reference),
    designation: toInputValue(initialData.designation),

    etatArticle:
      initialData.etatArticle === 'INACTIF' || initialData.actif === false
        ? 'INACTIF'
        : 'ACTIF',

    categorie:
      (initialData.categorie as CategorieArticleValue | undefined) ??
      'PIECE_RECHANGE',

    idFamille: initialData.idFamille ? String(initialData.idFamille) : '',

    fournisseurPrincipal: toInputValue(initialData.fournisseurPrincipal),
    fabricantArticle: toInputValue(initialData.fabricantArticle),
    referenceFabricant: toInputValue(initialData.referenceFabricant),

    idUniteArticle: initialData.idUniteArticle
      ? String(initialData.idUniteArticle)
      : '',

    nbDecimales: toInputValue(initialData.nbDecimales ?? 0),
    codeBarres: toInputValue(initialData.codeBarres),

    centreCout: toInputValue(initialData.centreCout),
    budget: toInputValue(initialData.budget),
    codeComptable: toInputValue(initialData.codeComptable),
    natureAchat: toInputValue(initialData.natureAchat),
    taxe: toInputValue(initialData.taxe),
    prixStandard: toInputValue(initialData.prixStandard),
    prixMoyenPondere: toInputValue(initialData.prixMoyenPondere),

    gereEnStock: initialData.gereEnStock ?? true,
    gereParLot: initialData.gereParLot ?? false,
    serialise: initialData.serialise ?? false,
    estModele: initialData.estModele ?? false,
  };
}

function getArticleTypeLabel(form: FormState) {
  if (form.serialise) return 'Article modèle sérialisé';
  if (form.estModele && form.gereEnStock) return 'Modèle stockable';
  if (form.estModele && !form.gereEnStock) return 'Modèle non stocké';
  if (!form.estModele && form.gereEnStock) return 'Article stockable';
  return 'Article non stocké';
}

function buildDefaultMateriel(
  index: number,
  reference: string,
  designation: string,
): MaterielInitialForm {
  const baseCode = reference.trim() || 'MAT';
  const label = designation.trim() || baseCode;

  return {
    code: `${baseCode}-${String(index + 1).padStart(3, '0')}`,
    numeroSerie: '',
    libelle: `${label} n°${index + 1}`,
  };
}

function syncMaterielsLength(
  current: MaterielInitialForm[],
  quantityValue: string,
  reference: string,
  designation: string,
) {
  const quantity = Number(quantityValue);

  if (!Number.isInteger(quantity) || quantity <= 0) return current;

  const next = [...current];

  while (next.length < quantity) {
    next.push(buildDefaultMateriel(next.length, reference, designation));
  }

  if (next.length > quantity) {
    next.length = quantity;
  }

  return next;
}

export function ArticleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: Props) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(initialData),
  );

  const [familles, setFamilles] = useState<Famille[]>([]);
  const [unites, setUnites] = useState<UniteArticle[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditMode = Boolean(initialData?.idArticle);
  const title = isEditMode ? 'Modifier l’article' : 'Nouvel article';

  const completion = useMemo(() => {
    const fields = [
      form.reference,
      form.designation,
      form.etatArticle,
      form.categorie,
      form.idFamille,
      form.idUniteArticle,
      form.prixStandard,
      form.prixMoyenPondere,
    ];

    const filled = fields.filter((field) => String(field).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  useEffect(() => {
    setForm(buildInitialForm(initialData));
  }, [initialData]);

  useEffect(() => {
    async function loadReferentiels() {
      try {
        setLoadingRefs(true);

        const [famillesData, unitesData, magasinsData] = await Promise.all([
          getFamilles(),
          getUnitesArticles(),
          getMagasins(),
        ]);

        setFamilles(famillesData ?? []);
        setUnites(unitesData ?? []);
        setMagasins((magasinsData ?? []).filter((magasin) => magasin.actif));
      } catch {
        setFamilles([]);
        setUnites([]);
        setMagasins([]);
      } finally {
        setLoadingRefs(false);
      }
    }

    loadReferentiels();
  }, []);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleGereEnStockChange(value: boolean) {
    setForm((previous) => ({
      ...previous,
      gereEnStock: value,
      serialise: value ? previous.serialise : false,
      gereParLot: value ? previous.gereParLot : false,
      useStockInitial: value ? previous.useStockInitial : false,
      stockIdMagasin: value ? previous.stockIdMagasin : '',
      stockQuantite: value ? previous.stockQuantite : '',
      stockPrixUnitaire: value ? previous.stockPrixUnitaire : '',
      stockNumeroLot: value ? previous.stockNumeroLot : '',
      stockDatePeremption: value ? previous.stockDatePeremption : '',
      stockObservation: value ? previous.stockObservation : '',
      stockMateriels: value ? previous.stockMateriels : [],
    }));
  }

  function handleGereParLotChange(value: boolean) {
    setForm((previous) => ({
      ...previous,
      gereParLot: value,
      gereEnStock: value ? true : previous.gereEnStock,
      serialise: value ? false : previous.serialise,
      stockMateriels: value ? [] : previous.stockMateriels,
    }));
  }

  function handleSerialiseChange(value: boolean) {
    setForm((previous) => {
      const next = {
        ...previous,
        serialise: value,
        estModele: value ? true : previous.estModele,
        gereEnStock: value ? true : previous.gereEnStock,
        gereParLot: value ? false : previous.gereParLot,
        stockNumeroLot: value ? '' : previous.stockNumeroLot,
      };

      return {
        ...next,
        stockMateriels: value
          ? syncMaterielsLength(
              previous.stockMateriels,
              previous.stockQuantite,
              previous.reference,
              previous.designation,
            )
          : [],
      };
    });
  }

  function handleEstModeleChange(value: boolean) {
    setForm((previous) => ({
      ...previous,
      estModele: value,
      serialise: value ? previous.serialise : false,
      stockMateriels: value ? previous.stockMateriels : [],
    }));
  }

  function handleUseStockInitialChange(value: boolean) {
    setForm((previous) => ({
      ...previous,
      useStockInitial: value,
      stockIdMagasin: value ? previous.stockIdMagasin : '',
      stockQuantite: value ? previous.stockQuantite : '',
      stockPrixUnitaire: value ? previous.stockPrixUnitaire : '',
      stockNumeroLot: value ? previous.stockNumeroLot : '',
      stockDatePeremption: value ? previous.stockDatePeremption : '',
      stockObservation: value ? previous.stockObservation : '',
      stockMateriels: value ? previous.stockMateriels : [],
    }));
  }

  function handleStockQuantiteChange(value: string) {
    setForm((previous) => {
      const next = {
        ...previous,
        stockQuantite: value,
      };

      if (!previous.serialise) return next;

      return {
        ...next,
        stockMateriels: syncMaterielsLength(
          previous.stockMateriels,
          value,
          previous.reference,
          previous.designation,
        ),
      };
    });
  }

  function updateStockMateriel(
    index: number,
    field: keyof MaterielInitialForm,
    value: string,
  ) {
    setForm((previous) => {
      const nextMateriels = [...previous.stockMateriels];

      nextMateriels[index] = {
        ...nextMateriels[index],
        [field]: value,
      };

      return {
        ...previous,
        stockMateriels: nextMateriels,
      };
    });
  }

  function validateStockInitial(): string | null {
    if (!form.useStockInitial || !form.gereEnStock) return null;

    if (!form.stockIdMagasin) {
      return 'Veuillez sélectionner un magasin pour le stock initial.';
    }

    const quantite = Number(form.stockQuantite);

    if (Number.isNaN(quantite) || quantite <= 0) {
      return 'La quantité initiale doit être supérieure à 0.';
    }

    const prix = optionalNumber(form.stockPrixUnitaire);

    if (prix !== undefined && prix < 0) {
      return 'Le prix unitaire du stock initial ne peut pas être négatif.';
    }

    if (form.gereParLot && !form.stockNumeroLot.trim()) {
      return 'Le numéro de lot est obligatoire pour un article géré par lots.';
    }

    if (form.serialise) {
      if (!Number.isInteger(quantite)) {
        return 'La quantité d’un article sérialisé doit être un nombre entier.';
      }

      if (form.stockMateriels.length !== quantite) {
        return `Vous devez renseigner exactement ${quantite} matériel(s).`;
      }

      const codes = form.stockMateriels.map((materiel) =>
        materiel.code.trim(),
      );

      if (codes.some((code) => !code)) {
        return 'Chaque matériel sérialisé doit avoir un code.';
      }

      const duplicatedCode = codes.find(
        (code, index) => codes.indexOf(code) !== index,
      );

      if (duplicatedCode) {
        return `Le code matériel "${duplicatedCode}" est répété.`;
      }

      const serialNumbers = form.stockMateriels
        .map((materiel) => materiel.numeroSerie.trim())
        .filter(Boolean);

      const duplicatedSerial = serialNumbers.find(
        (serial, index) => serialNumbers.indexOf(serial) !== index,
      );

      if (duplicatedSerial) {
        return `Le numéro de série "${duplicatedSerial}" est répété.`;
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.reference.trim()) {
      setError('Le code article est obligatoire.');
      return;
    }

    if (!form.designation.trim()) {
      setError('Le libellé est obligatoire.');
      return;
    }

    const nbDecimales = optionalInteger(form.nbDecimales);

    if (nbDecimales !== undefined && (nbDecimales < 0 || nbDecimales > 6)) {
      setError('Le nombre de décimales doit être compris entre 0 et 6.');
      return;
    }

    const stockInitialError = validateStockInitial();

    if (stockInitialError) {
      setError(stockInitialError);
      return;
    }

    const stockInitial =
      !isEditMode && form.useStockInitial && form.gereEnStock
        ? {
            idMagasin: Number(form.stockIdMagasin),
            quantite: Number(form.stockQuantite),
            prixUnitaire: optionalNumber(form.stockPrixUnitaire),
            numeroLot: nullableText(form.stockNumeroLot),
            datePeremption: form.stockDatePeremption || undefined,
            observation: nullableText(form.stockObservation),
            materiels: form.serialise
              ? form.stockMateriels.map((materiel) => ({
                  code: materiel.code.trim(),
                  numeroSerie: nullableText(materiel.numeroSerie),
                  libelle: nullableText(materiel.libelle),
                }))
              : undefined,
          }
        : undefined;

    const payload: CreateArticleDto = {
      reference: form.reference.trim(),
      designation: form.designation.trim(),

      etatArticle: form.etatArticle,
      actif: form.etatArticle === 'ACTIF',

      categorie: form.categorie,

      idFamille: form.idFamille ? Number(form.idFamille) : undefined,
      idUniteArticle: form.idUniteArticle
        ? Number(form.idUniteArticle)
        : undefined,

      fournisseurPrincipal: nullableText(form.fournisseurPrincipal),
      fabricantArticle: nullableText(form.fabricantArticle),
      referenceFabricant: nullableText(form.referenceFabricant),

      nbDecimales: nbDecimales ?? 0,
      codeBarres: nullableText(form.codeBarres),

      centreCout: nullableText(form.centreCout),
      budget: nullableText(form.budget),
      codeComptable: nullableText(form.codeComptable),
      natureAchat: nullableText(form.natureAchat),
      taxe: nullableText(form.taxe),

      prixStandard: optionalNumber(form.prixStandard),
      prixMoyenPondere: optionalNumber(form.prixMoyenPondere),

      gereEnStock: form.gereEnStock,
      gereParLot: form.gereParLot,
      serialise: form.serialise,
      estModele: form.estModele,

      reparable: form.serialise || form.estModele,

      createdBy: isEditMode ? undefined : 'admin',
      updatedBy: 'admin',

      stockInitial,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
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
          onClick={onCancel}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour
        </button>

        <section className="mb-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06475a] text-white">
                {form.serialise ? (
                  <PackageCheck className="h-7 w-7" />
                ) : (
                  <Boxes className="h-7 w-7" />
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  Module stock
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge>{getArticleTypeLabel(form)}</Badge>

              <Badge variant={form.etatArticle === 'ACTIF' ? 'success' : 'muted'}>
                {form.etatArticle === 'ACTIF' ? 'Actif' : 'Inactif'}
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
          <FormSection icon={<Tags className="h-5 w-5" />} title="Gestion">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Code" required>
                <input
                  value={form.reference}
                  onChange={(event) =>
                    updateField('reference', event.target.value)
                  }
                  placeholder="Ex : 02010008"
                  className={inputClassName}
                />
              </Field>

              <Field label="Libellé" required>
                <input
                  value={form.designation}
                  onChange={(event) =>
                    updateField('designation', event.target.value)
                  }
                  placeholder="Ex : Batterie 8V / 60A"
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="État">
                <Select
                  value={form.etatArticle}
                  onValueChange={(value: string) =>
                    updateField('etatArticle', value as EtatArticleValue)
                  }
                  items={[
                    { label: 'Actif', value: 'ACTIF' },
                    { label: 'Inactif', value: 'INACTIF' },
                  ]}
                />
              </Field>

              <Field label="Catégorie">
                <Select
                  value={form.categorie}
                  onValueChange={(value: string) =>
                    updateField('categorie', value as CategorieArticleValue)
                  }
                  items={CATEGORIE_OPTIONS}
                />
              </Field>

              <Field label="Famille">
                <Select
                  value={form.idFamille || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField('idFamille', value === 'NONE' ? '' : value)
                  }
                  items={[
                    { label: 'Aucune famille', value: 'NONE' },
                    ...familles.map((famille) => ({
                      value: String(famille.idFamille),
                      label: `${famille.code || ''} — ${famille.libelle || ''}`,
                    })),
                  ]}
                />

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {loadingRefs
                    ? 'Chargement des familles...'
                    : 'Famille de rattachement de l’article.'}
                </p>
              </Field>

              <Field label="Fournisseur principal">
                <input
                  value={form.fournisseurPrincipal}
                  onChange={(event) =>
                    updateField('fournisseurPrincipal', event.target.value)
                  }
                  placeholder="Ex : DUBOIS"
                  className={inputClassName}
                />
              </Field>

              <Field label="Fabricant">
                <input
                  value={form.fabricantArticle}
                  onChange={(event) =>
                    updateField('fabricantArticle', event.target.value)
                  }
                  placeholder="Ex : DUBOIS"
                  className={inputClassName}
                />
              </Field>

              <Field label="Référence fabricant">
                <input
                  value={form.referenceFabricant}
                  onChange={(event) =>
                    updateField('referenceFabricant', event.target.value)
                  }
                  placeholder="Ex : BT8"
                  className={inputClassName}
                />
              </Field>

              <Field label="Unité">
                <Select
                  value={form.idUniteArticle || 'NONE'}
                  onValueChange={(value: string) =>
                    updateField(
                      'idUniteArticle',
                      value === 'NONE' ? '' : value,
                    )
                  }
                  items={[
                    { label: 'Aucune unité', value: 'NONE' },
                    ...unites.map((unite) => ({
                      value: String(unite.idUniteArticle),
                      label: `${unite.code || ''} — ${unite.libelle || ''}`,
                    })),
                  ]}
                />
              </Field>

              <Field label="Nombre de décimales">
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={form.nbDecimales}
                  onChange={(event) =>
                    updateField('nbDecimales', event.target.value)
                  }
                  placeholder="Ex : 0"
                  className={inputClassName}
                />
              </Field>

              <Field label="Code-barres">
                <input
                  value={form.codeBarres}
                  onChange={(event) =>
                    updateField('codeBarres', event.target.value)
                  }
                  placeholder="Ex : BAT-8V-60A"
                  className={inputClassName}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Coins className="h-5 w-5" />} title="Imputation">
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Centre de coût">
                <input
                  value={form.centreCout}
                  onChange={(event) =>
                    updateField('centreCout', event.target.value)
                  }
                  placeholder="Ex : 100"
                  className={inputClassName}
                />
              </Field>

              <Field label="Budget">
                <input
                  value={form.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  placeholder="Ex : CB-STOCK"
                  className={inputClassName}
                />
              </Field>

              <Field label="Code comptable">
                <input
                  value={form.codeComptable}
                  onChange={(event) =>
                    updateField('codeComptable', event.target.value)
                  }
                  placeholder="Ex : 6100"
                  className={inputClassName}
                />
              </Field>

              <Field label="Nature d’achat">
                <input
                  value={form.natureAchat}
                  onChange={(event) =>
                    updateField('natureAchat', event.target.value)
                  }
                  placeholder="Ex : ELECTRIQUE"
                  className={inputClassName}
                />
              </Field>

              <Field label="Taxe">
                <input
                  value={form.taxe}
                  onChange={(event) => updateField('taxe', event.target.value)}
                  placeholder="Ex : TVA 19%"
                  className={inputClassName}
                />
              </Field>

              <Field label="Prix standard">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.prixStandard}
                  onChange={(event) =>
                    updateField('prixStandard', event.target.value)
                  }
                  placeholder="Ex : 2500"
                  className={inputClassName}
                />
              </Field>

              <Field label="PMP">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.prixMoyenPondere}
                  onChange={(event) =>
                    updateField('prixMoyenPondere', event.target.value)
                  }
                  placeholder="Ex : 2500"
                  className={inputClassName}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Settings2 className="h-5 w-5" />} title="Paramètres">
            <div className="grid gap-3 lg:grid-cols-4">
              <ChoiceCard
                active={form.gereEnStock}
                icon={<Warehouse className="h-5 w-5" />}
                title="Géré en stock"
                description="Autorise entrées, sorties et inventaires."
                onClick={() => handleGereEnStockChange(!form.gereEnStock)}
              />

              <ChoiceCard
                active={form.gereParLot}
                icon={<Boxes className="h-5 w-5" />}
                title="Gestion par lots"
                description="Suivi des lots pendant les mouvements."
                onClick={() => handleGereParLotChange(!form.gereParLot)}
              />

              <ChoiceCard
                active={form.serialise}
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Sérialisé"
                description="Chaque unité devient un matériel."
                onClick={() => handleSerialiseChange(!form.serialise)}
              />

              <ChoiceCard
                active={form.estModele}
                icon={<PackageCheck className="h-5 w-5" />}
                title="Modèle"
                description="Crée ou lie un modèle équipement."
                onClick={() => handleEstModeleChange(!form.estModele)}
              />
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-blue-800">
              Si l’article est sérialisé, le système force automatiquement
              <strong> Modèle = Oui</strong> et
              <strong> Géré en stock = Oui</strong>. Si la gestion par lots est
              activée, l’article ne peut pas être sérialisé.
            </div>
          </FormSection>

          {!isEditMode && form.gereEnStock && (
            <FormSection
              icon={<Warehouse className="h-5 w-5" />}
              title="Stock initial"
            >
              <ChoiceCard
                active={form.useStockInitial}
                icon={<Plus className="h-5 w-5" />}
                title="Créer un stock initial"
                description="Créer automatiquement un bon d’entrée, une ligne de stock et un mouvement."
                onClick={() =>
                  handleUseStockInitialChange(!form.useStockInitial)
                }
              />

              {form.useStockInitial && (
                <>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Field label="Magasin" required>
                      <Select
                        value={form.stockIdMagasin || 'NONE'}
                        onValueChange={(value: string) =>
                          updateField(
                            'stockIdMagasin',
                            value === 'NONE' ? '' : value,
                          )
                        }
                        items={[
                          { label: 'Sélectionner un magasin', value: 'NONE' },
                          ...magasins.map((magasin) => ({
                            value: String(magasin.idMagasin),
                            label: `${magasin.code} — ${magasin.libelle}`,
                          })),
                        ]}
                      />
                    </Field>

                    <Field label="Quantité initiale" required>
                      <input
                        type="number"
                        min={0}
                        step={form.serialise ? 1 : 0.01}
                        value={form.stockQuantite}
                        onChange={(event) =>
                          handleStockQuantiteChange(event.target.value)
                        }
                        placeholder="Ex : 10"
                        className={inputClassName}
                      />
                    </Field>

                    <Field label="Prix unitaire">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.stockPrixUnitaire}
                        onChange={(event) =>
                          updateField('stockPrixUnitaire', event.target.value)
                        }
                        placeholder="Ex : 2500"
                        className={inputClassName}
                      />
                    </Field>

                    {form.gereParLot && (
                      <Field label="Numéro de lot" required>
                        <input
                          value={form.stockNumeroLot}
                          onChange={(event) =>
                            updateField('stockNumeroLot', event.target.value)
                          }
                          placeholder="Ex : LOT-2026-001"
                          className={inputClassName}
                        />
                      </Field>
                    )}

                    <Field label="Date de péremption">
                      <input
                        type="date"
                        value={form.stockDatePeremption}
                        onChange={(event) =>
                          updateField(
                            'stockDatePeremption',
                            event.target.value,
                          )
                        }
                        className={inputClassName}
                      />
                    </Field>

                    <Field label="Observation">
                      <input
                        value={form.stockObservation}
                        onChange={(event) =>
                          updateField('stockObservation', event.target.value)
                        }
                        placeholder="Ex : Stock initial à la création"
                        className={inputClassName}
                      />
                    </Field>
                  </div>

                  {form.serialise && (
                    <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Matériels sérialisés
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Pour un article sérialisé, chaque unité entrée en stock
                          doit avoir son propre matériel.
                        </p>
                      </div>

                      {form.stockMateriels.length === 0 ? (
                        <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500">
                          Saisis une quantité initiale entière pour générer les
                          lignes de matériels.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {form.stockMateriels.map((materiel, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-black text-slate-800">
                                  Matériel {index + 1}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm((previous) => ({
                                      ...previous,
                                      stockMateriels:
                                        previous.stockMateriels.filter(
                                          (_, itemIndex) => itemIndex !== index,
                                        ),
                                      stockQuantite: String(
                                        Math.max(
                                          0,
                                          previous.stockMateriels.length - 1,
                                        ),
                                      ),
                                    }))
                                  }
                                  className="rounded-xl border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-3">
                                <Field label="Code matériel" required>
                                  <input
                                    value={materiel.code}
                                    onChange={(event) =>
                                      updateStockMateriel(
                                        index,
                                        'code',
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Ex : MOT-45KW-001"
                                    className={inputClassName}
                                  />
                                </Field>

                                <Field label="N° série">
                                  <input
                                    value={materiel.numeroSerie}
                                    onChange={(event) =>
                                      updateStockMateriel(
                                        index,
                                        'numeroSerie',
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Ex : SN-MOT-001"
                                    className={inputClassName}
                                  />
                                </Field>

                                <Field label="Libellé matériel">
                                  <input
                                    value={materiel.libelle}
                                    onChange={(event) =>
                                      updateStockMateriel(
                                        index,
                                        'libelle',
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Ex : Moteur 45KW n°1"
                                    className={inputClassName}
                                  />
                                </Field>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </FormSection>
          )}

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
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex min-h-[92px] items-start justify-between rounded-2xl border px-4 py-4 text-left transition',
        active
          ? 'border-[#06475a] bg-[#e8f7fb] text-[#06475a] shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-[#06475a]/30 hover:bg-[#f0fafc]',
      ].join(' ')}
    >
      <span className="flex gap-3">
        <span
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            active ? 'bg-white text-[#06475a]' : 'bg-slate-50 text-slate-500',
          ].join(' ')}
        >
          {icon}
        </span>

        <span>
          <span className="block text-sm font-extrabold">{title}</span>

          {description && (
            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">
              {description}
            </span>
          )}
        </span>
      </span>

      {active && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#06475a] text-white">
          <Check className="h-4 w-4" />
        </span>
      )}
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