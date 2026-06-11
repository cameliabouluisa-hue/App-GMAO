'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { MaterielForm } from '@/features/materiels/components/MaterielForm';
import {
  getMateriel,
  updateMateriel,
} from '@/features/materiels/services/materiel.service';

import type {
  Materiel,
  UpdateMaterielDto,
} from '@/features/materiels/types/materiel';

export default function ModifierMaterielPage() {
  const params = useParams();

  const id = Number(params.id);

  const [materiel, setMateriel] = useState<Materiel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMateriel() {
      try {
        setLoading(true);
        setError('');

        const data = await getMateriel(id);
        setMateriel(data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger le matériel.');
      } finally {
        setLoading(false);
      }
    }

    if (!Number.isNaN(id)) {
      loadMateriel();
    }
  }, [id]);

  async function handleUpdate(data: UpdateMaterielDto) {
    await updateMateriel(id, data);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-5 py-6">
        <div className="mx-auto max-w-[1280px] rounded-[26px] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm">
          Chargement du matériel...
        </div>
      </main>
    );
  }

  if (error || !materiel) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-5 py-6">
        <div className="mx-auto max-w-[1280px] rounded-[26px] border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error || 'Matériel introuvable.'}
        </div>
      </main>
    );
  }

  return (
    <MaterielForm
      mode="edit"
      initialData={materiel}
      onSubmit={handleUpdate}
    />
  );
}