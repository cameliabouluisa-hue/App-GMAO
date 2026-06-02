import { ChevronDown, Download, Search, X } from 'lucide-react';
import type { FamilleFilterType } from '@/features/familles/types/famille';

type FamilleToolbarProps = {
  search: string;
  filterType: FamilleFilterType;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onFilterChange: (value: FamilleFilterType) => void;
  onExport: () => void;
  onCreate: () => void;
};

export default function FamilleToolbar({
  search,
  filterType,
  onSearchChange,
  onClearSearch,
  onFilterChange,
  onExport,
}: FamilleToolbarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_290px_auto]">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par code ou libellé..."
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#06465a] focus:bg-white"
        />

        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value as FamilleFilterType)}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-bold text-slate-950 outline-none transition focus:border-[#06465a] focus:bg-white"
        >
          <option value="all">Toutes les familles</option>
          <option value="parents">Familles parentes</option>
          <option value="withModels">Familles avec modèles</option>
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <Download size={18} />
        Exporter
      </button>
    </div>
  );
}