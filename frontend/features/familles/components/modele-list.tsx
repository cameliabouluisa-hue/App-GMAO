import { Eye, Pencil, Trash2, Box } from 'lucide-react';
import type { Modele } from '@/types/modele';

type ModeleListProps = {
  modeles: Modele[];
  level: number;
  onViewModele: (modeleId: number) => void;
  onEditModele: (modeleId: number) => void;
  onDeleteModele: (modeleId: number) => void;
};

export default function ModeleList({
  modeles,
  level,
  onViewModele,
  onEditModele,
  onDeleteModele,
}: ModeleListProps) {
  return (
    <div className="bg-slate-50 px-5 py-4">
      <div
        className="mb-3 flex items-center gap-2"
        style={{ paddingLeft: `${level * 24 + 48}px` }}
      >
        <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
          Modèles
        </span>

        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-600">
          {modeles.length}
        </span>
      </div>

      <div
        className="space-y-2"
        style={{ paddingLeft: `${level * 24 + 48}px` }}
      >
        {modeles.map((modele) => (
          <div
            key={modele.idModele}
            className="flex max-w-4xl items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Box size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {modele.libelle || 'Sans libellé'}
                </p>

                {modele.code && (
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {modele.code}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onViewModele(modele.idModele)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <Eye size={17} />
              </button>

              <button
                type="button"
                onClick={() => onEditModele(modele.idModele)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil size={17} />
              </button>

              <button
                type="button"
                onClick={() => onDeleteModele(modele.idModele)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}