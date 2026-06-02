'use client';

import { Search, RefreshCcw, Network } from 'lucide-react';
import { useMemo, useState } from 'react';

import TreeNode from './TreeNode';
import { ArborescenceMode, ArborescenceNode } from '../types/arborescence.types';

type Props = {
  data: ArborescenceNode[];
  mode: ArborescenceMode;
};

function filterTree(nodes: ArborescenceNode[], search: string): ArborescenceNode[] {
  if (!search.trim()) return nodes;

  const q = search.toLowerCase();

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? [], search);

      const match =
        node.code?.toLowerCase().includes(q) ||
        node.libelle?.toLowerCase().includes(q);

      if (match || children.length > 0) {
        return { ...node, children };
      }

      return null;
    })
    .filter(Boolean) as ArborescenceNode[];
}

export default function TreeView({ data, mode }: Props) {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => filterTree(data, search), [data, search]);

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou libellé..."
            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-[#064e5f] focus:bg-white"
          />
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCcw size={18} />
          Actualiser
        </button>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#064e5f]">
            <Network size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-950">
              Arborescence {mode === 'GEOGRAPHIQUE' ? 'géographique' : 'technique'}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {filteredData.length} point(s) racine affiché(s)
            </p>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Aucun élément trouvé.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((node) => (
              <TreeNode key={node.key} node={node} level={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}