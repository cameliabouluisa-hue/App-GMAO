'use client';

import { ChevronDown, ChevronRight, MapPin, Package, Wrench } from 'lucide-react';
import { useState } from 'react';

import { ArborescenceNode } from '../types/arborescence.types';

type Props = {
  node: ArborescenceNode;
  level: number;
};

export default function TreeNode({ node, level }: Props) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const isMateriel = node.type === 'MATERIEL';
  const isTechnique = node.typePoint === 'TECHNIQUE';

  const icon = isMateriel ? (
    <Package size={18} />
  ) : isTechnique ? (
    <Wrench size={18} />
  ) : (
    <MapPin size={18} />
  );

  const badgeLabel = isMateriel
    ? 'Matériel'
    : isTechnique
      ? 'Technique'
      : 'Géographique';

  const badgeClass = isMateriel
    ? 'bg-purple-50 text-purple-700'
    : isTechnique
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700';

  return (
    <div>
      <div
        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#064e5f]/30 hover:bg-slate-50"
        style={{ marginLeft: level * 24 }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
        >
          {hasChildren ? (
            open ? <ChevronDown size={18} /> : <ChevronRight size={18} />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          )}
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-[#064e5f]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
           

            <span className="truncate text-sm font-black text-slate-950">
              {node.libelle ?? 'Sans libellé'}
            </span>

            <span className={`rounded-xl px-3 py-1 text-xs font-black ${badgeClass}`}>
              {badgeLabel}
            </span>
          </div>
        </div>

        {hasChildren && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {node.children.length}
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode key={child.key} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
} 