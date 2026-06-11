'use client';

import { MaterielForm } from '@/features/materiels/components/MaterielForm';
import { createMateriel } from '@/features/materiels/services/materiel.service';
import type { CreateMaterielDto } from '@/features/materiels/types/materiel';

export default function NouveauMaterielPage() {
  async function handleSubmit(data: CreateMaterielDto) {
    await createMateriel(data);
  }

  return <MaterielForm mode="create" onSubmit={handleSubmit} />;
}