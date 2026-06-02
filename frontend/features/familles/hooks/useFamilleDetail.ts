'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  deleteFamille,
  getFamille,
  getFamilles,
} from '@/features/familles/services/famille.service';

import type { FamilleApi } from '@/features/familles/types/famille';

type UseFamilleDetailOptions = {
  familleId: number | string;
  onDeleteSuccess?: () => void;
};

type FamilleDetailApi = FamilleApi & {
  famille?: FamilleApi | null;
  other_famille?: FamilleApi[] | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useFamilleDetail({
  familleId,
  onDeleteSuccess,
}: UseFamilleDetailOptions) {
  const [famille, setFamille] = useState<FamilleDetailApi | null>(null);
  const [parentFamille, setParentFamille] = useState<FamilleApi | null>(null);
  const [sousFamilles, setSousFamilles] = useState<FamilleApi[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFamille = useCallback(async () => {
    const id = toNumber(familleId);

    if (!id) {
      setFamille(null);
      setParentFamille(null);
      setSousFamilles([]);
      setLoading(false);
      setError('Identifiant de famille invalide.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = (await getFamille(id)) as FamilleDetailApi;

      setFamille(data);

      const allFamilles = await getFamilles();

      const parentId = toNumber(data.parent_id);

      const parent =
        data.famille ??
        allFamilles.find(
          (item) => Number(item.idFamille) === Number(parentId),
        ) ??
        null;

      setParentFamille(parent);

      const childrenFromApi = Array.isArray(data.other_famille)
        ? data.other_famille
        : [];

      const children =
        childrenFromApi.length > 0
          ? childrenFromApi
          : allFamilles.filter(
              (item) => Number(item.parent_id) === Number(data.idFamille),
            );

      setSousFamilles(children);
    } catch (err) {
      setFamille(null);
      setParentFamille(null);
      setSousFamilles([]);

      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger la famille.',
      );
    } finally {
      setLoading(false);
    }
  }, [familleId]);

  useEffect(() => {
    loadFamille();
  }, [loadFamille]);

  async function handleDelete() {
    const id = toNumber(familleId);

    if (!id) {
      setError('Identifiant de famille invalide.');
      return;
    }

    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer cette famille ?',
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      await deleteFamille(id);
      onDeleteSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer la famille.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return {
    famille,
    parentFamille,
    sousFamilles,
    loading,
    deleting,
    error,
    refresh: loadFamille,
    handleDelete,
  };
}