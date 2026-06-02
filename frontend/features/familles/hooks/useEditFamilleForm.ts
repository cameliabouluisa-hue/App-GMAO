'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
  getFamille,
  getFamilles,
  updateFamille,
} from '@/features/familles/services/famille.service';

import type {
  FamilleApi,
  FamilleFormValues,
  NatureAchatFamille,
  TypeFamille,
} from '@/features/familles/types/famille';

type UseEditFamilleFormOptions = {
  familleId: string;
  onSuccess?: () => void;
};

const initialValues: FamilleFormValues = {
  code: '',
  libelle: '',
  parentId: '',
  actif: true,
  typeFamille: 'EQUIPEMENT',
  natureAchat: '',
};

export function useEditFamilleForm({
  familleId,
  onSuccess,
}: UseEditFamilleFormOptions) {
  const [values, setValues] = useState<FamilleFormValues>(initialValues);
  const [familles, setFamilles] = useState<FamilleApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParents, setLoadingParents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setLoadingParents(true);
        setError(null);

        const [famille, allFamilles] = await Promise.all([
          getFamille(familleId),
          getFamilles(),
        ]);

        setValues({
          code: famille.code ?? '',
          libelle: famille.libelle ?? '',
          parentId: famille.parent_id ? String(famille.parent_id) : '',
          actif: famille.actif ?? true,
          typeFamille: famille.typeFamille ?? 'EQUIPEMENT',
          natureAchat: famille.natureAchat ?? '',
        });

        setFamilles(
          allFamilles.filter(
            (item) => item.idFamille !== Number(familleId),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger la famille.',
        );
      } finally {
        setLoading(false);
        setLoadingParents(false);
      }
    }

    if (familleId) {
      loadData();
    }
  }, [familleId]);

  function setCode(value: string) {
    setValues((prev) => ({ ...prev, code: value }));
  }

  function setLibelle(value: string) {
    setValues((prev) => ({ ...prev, libelle: value }));
  }

  function setParentId(value: string) {
    setValues((prev) => ({ ...prev, parentId: value }));
  }

  function setActif(value: boolean) {
    setValues((prev) => ({ ...prev, actif: value }));
  }

  function setTypeFamille(value: TypeFamille) {
    setValues((prev) => ({ ...prev, typeFamille: value }));
  }

  function setNatureAchat(value: NatureAchatFamille | '') {
    setValues((prev) => ({ ...prev, natureAchat: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!values.code.trim()) {
      setError('Le code famille est obligatoire.');
      return;
    }

    if (!values.libelle.trim()) {
      setError('Le libellé est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await updateFamille(familleId, values);

      setSuccess('Famille modifiée avec succès.');

      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier la famille.',
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    values,
    familles,
    loading,
    loadingParents,
    saving,
    error,
    success,

    setCode,
    setLibelle,
    setParentId,
    setActif,
    setTypeFamille,
    setNatureAchat,

    handleSubmit,
  };
}