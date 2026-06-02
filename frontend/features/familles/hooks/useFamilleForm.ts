'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  createFamille,
  getFamilles,
} from '@/features/familles/services/famille.service';


import type {
  FamilleApi,
  FamilleFormValues,
  
  NatureAchatFamille,
  TypeFamille,
} from '@/features/familles/types/famille';
export type EtatFamilleValue = 'BROUILLON' | 'VALIDE' | 'ARCHIVE';

export type TypeFamilleValue = 'EQUIPEMENT' | 'ARTICLE' | 'MIXTE';



type UseFamilleFormOptions = {
  onSuccess?: () => void;
  initialValues?: Partial<FamilleFormValues>;
};

const DEFAULT_VALUES: FamilleFormValues = {
  code: '',
  libelle: '',
  parentId: '',

  actif: true,
  natureAchat: '',
  typeFamille: 'EQUIPEMENT',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Une erreur inconnue est survenue.';
}

export function useFamilleForm(options: UseFamilleFormOptions = {}) {
  const [values, setValues] = useState<FamilleFormValues>({
    ...DEFAULT_VALUES,
    ...options.initialValues,
  });

  const [familles, setFamilles] = useState<FamilleApi[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFamilles() {
      try {
        setLoadingParents(true);

        const data = await getFamilles();

        if (!mounted) return;

        setFamilles(data);
      } catch (err) {
        if (!mounted) return;

        setError(getErrorMessage(err));
      } finally {
        if (!mounted) return;

        setLoadingParents(false);
      }
    }

    loadFamilles();

    return () => {
      mounted = false;
    };
  }, []);

  function setCode(value: string) {
    setValues((prev) => ({
      ...prev,
      code: value,
    }));
  }

  function setLibelle(value: string) {
    setValues((prev) => ({
      ...prev,
      libelle: value,
    }));
  }

  function setParentId(value: string) {
    setValues((prev) => ({
      ...prev,
      parentId: value,
    }));
  }

  function setEtat(value: EtatFamilleValue) {
    setValues((prev) => ({
      ...prev,
      etat: value,
    }));
  }

  function setActif(value: boolean) {
    setValues((prev) => ({
      ...prev,
      actif: value,
    }));
  }

  function setNatureAchat(value: NatureAchatFamille) {
    setValues((prev) => ({
      ...prev,
      natureAchat: value,
    }));
  }

  function setTypeFamille(value: TypeFamilleValue) {
    setValues((prev) => ({
      ...prev,
      typeFamille: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const code = values.code.trim();
    const libelle = values.libelle.trim();

    if (!code) {
      setError('Le code de la famille est obligatoire.');
      return;
    }

    if (!libelle) {
      setError('Le libellé de la famille est obligatoire.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code,
        libelle,
        parent_id: values.parentId ? Number(values.parentId) : null,

      
        actif: values.actif,
        natureAchat: values.natureAchat || null,
        typeFamille: values.typeFamille,
      };

      await createFamille(payload as Parameters<typeof createFamille>[0]);

      setSuccess('Famille créée avec succès.');

      window.setTimeout(() => {
        options.onSuccess?.();
      }, 350);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return {
    values,
    familles,
    loadingParents,
    saving,
    error,
    success,

    setCode,
    setLibelle,
    setParentId,
    setEtat,
    setActif,
    setNatureAchat,
    setTypeFamille,

    handleSubmit,
  };
}

export default useFamilleForm;