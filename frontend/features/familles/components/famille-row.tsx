import {
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  Pencil,
  Trash2,
} from 'lucide-react';

import type {
  FamilleApi,
  FamilleNode,
} from '@/features/familles/types/famille';
import ModeleList from '@/features/familles/components/modele-list';

type FamilleRowProps = {
  node: FamilleNode;
  level: number;
  expanded: Record<number, boolean>;
  showModeles: Record<number, boolean>;
  famillesMap: Map<number, FamilleApi>;
  onToggleRow: (id: number) => void;
  onToggleModeles: (id: number) => void;
  onViewFamille: (idFamille: number) => void;
  onEditFamille: (idFamille: number) => void;
  onDeleteFamille: (idFamille: number) => void;
  onViewModele: (modeleId: number) => void;
  onEditModele: (modeleId: number) => void;
  onDeleteModele: (modeleId: number) => void;
};

export default function FamilleRow({
  node,
  level,
  expanded,
  showModeles,
  famillesMap,
  onToggleRow,
  onToggleModeles,
  onViewFamille,
  onEditFamille,
  onDeleteFamille,
  onViewModele,
  onEditModele,
  onDeleteModele,
}: FamilleRowProps) {
  const parentFamille =
    node.parent_id && famillesMap.has(node.parent_id)
      ? famillesMap.get(node.parent_id)
      : null;

  const hasChildren = node.children.length > 0;
  const hasModeles = (node.modele?.length || 0) > 0;
  const isExpanded = expanded[node.idFamille] !== false;
  const isModelesVisible = showModeles[node.idFamille] === true;

  return (
    <div className="bg-white">
      <div className="grid grid-cols-12 gap-4 px-5 py-4 text-sm transition hover:bg-slate-50">
        <div
          className="col-span-4 flex min-w-0 items-center gap-3"
          style={{ paddingLeft: `${level * 28}px` }}
        >
          <button
            type="button"
            onClick={() => {
              if (hasChildren) onToggleRow(node.idFamille);
            }}
            disabled={!hasChildren}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:text-slate-300"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            )}
          </button>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#06465a]">
            <FolderTree size={21} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-black text-slate-950">
              {node.libelle || 'Sans libellé'}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              {hasModeles && (
                <button
                  type="button"
                  onClick={() => onToggleModeles(node.idFamille)}
                  className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700 transition hover:bg-purple-100"
                >
                  {isModelesVisible ? 'Masquer modèles' : 'Afficher modèles'}
                </button>
              )}

              {hasChildren && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {node.children.length} sous-famille(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex items-center">
          <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {node.code || '—'}
          </span>
        </div>

        <div className="col-span-2 flex items-center text-[15px] font-bold text-slate-600">
          {parentFamille?.libelle || 'Aucune'}
        </div>

        <div className="col-span-2 flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {node.children.length}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onViewFamille(node.idFamille)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Voir"
          >
            <Eye size={17} />
          </button>

          <button
            type="button"
            onClick={() => onEditFamille(node.idFamille)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Modifier"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDeleteFamille(node.idFamille)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
            title="Supprimer"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {hasModeles && isModelesVisible && (
        <ModeleList
          modeles={node.modele || []}
          level={level}
          onViewModele={onViewModele}
          onEditModele={onEditModele}
          onDeleteModele={onDeleteModele}
        />
      )}
    </div>
  );
}