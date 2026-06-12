'use client';

import { useState } from 'react';
import { Building, FolderTree, Wrench } from 'lucide-react';

import TreeView from './TreeView';
import {
  ArborescenceMode,
  ArborescenceNode,
} from '../types/arborescence.types';

type Props = {
  geographique: ArborescenceNode[];
  technique: ArborescenceNode[];
  familles: ArborescenceNode[];
};

export default function ArborescenceTabs({
  geographique,
  technique,
  familles,
}: Props) {
  const [mode, setMode] = useState<ArborescenceMode>('GEOGRAPHIQUE');

  const data =
    mode === 'GEOGRAPHIQUE'
      ? geographique
      : mode === 'TECHNIQUE'
        ? technique
        : familles;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
            Module équipements
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Vue arborescente
          </h2>
        </div>

        <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('GEOGRAPHIQUE')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              mode === 'GEOGRAPHIQUE'
                ? 'bg-[#064e5f] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building size={18} />
            Géographique
          </button>

          <button
            type="button"
            onClick={() => setMode('TECHNIQUE')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              mode === 'TECHNIQUE'
                ? 'bg-[#064e5f] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench size={18} />
            Technique
          </button>

          <button
            type="button"
            onClick={() => setMode('FAMILLE')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              mode === 'FAMILLE'
                ? 'bg-[#064e5f] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderTree size={18} />
            Familles
          </button>
        </div>
      </div>

      <TreeView data={data} mode={mode} />
    </section>
  );
}