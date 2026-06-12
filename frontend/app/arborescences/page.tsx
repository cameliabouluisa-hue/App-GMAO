import ArborescenceTabs from '@/features/arborescences/components/ArborescenceTabs';

import {
  getArborescenceFamilles,
  getArborescenceGeographique,
  getArborescenceTechnique,
} from '@/features/arborescences/services/arborescence.service';

export default async function ArborescencesPage() {
  const [geographique, technique, familles] = await Promise.all([
    getArborescenceGeographique(),
    getArborescenceTechnique(),
    getArborescenceFamilles(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ArborescenceTabs
          geographique={geographique}
          technique={technique}
          familles={familles}
        />
      </div>
    </main>
  );
}