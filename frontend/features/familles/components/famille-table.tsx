import type {
  FamilleApi,
  FamilleFlatRow,
} from '@/features/familles/types/famille';
import FamilleRow from '@/features/familles/components/famille-row';

type FamilleTableProps = {
  visibleRows: FamilleFlatRow[];
  famillesMap: Map<number, FamilleApi>;
  expanded: Record<number, boolean>;
  showModeles: Record<number, boolean>;
  onToggleRow: (id: number) => void;
  onToggleModeles: (id: number) => void;
  onViewFamille: (idFamille: number) => void;
  onEditFamille: (idFamille: number) => void;
  onDeleteFamille: (idFamille: number) => void;
  onViewModele: (modeleId: number) => void;
  onEditModele: (modeleId: number) => void;
  onDeleteModele: (modeleId: number) => void;
};

export default function FamilleTable(props: FamilleTableProps) {
  const { visibleRows } = props;

  return (
    <>
      <div className="grid grid-cols-12 gap-4 bg-slate-50 px-5 py-4  font-bold  text-[10px]  uppercase tracking-[0.25em] text-slate-400">
  <div className="col-span-4">Famille</div>
  <div className="col-span-2">Code</div>
  <div className="col-span-2">Parent</div>
  <div className="col-span-2 text-center">Sous-familles</div>
  <div className="col-span-2 text-center">Actions</div>
</div>

      {visibleRows.length === 0 ? (
        <div className="p-8 text-sm text-slate-500">Aucune famille trouvée.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visibleRows.map(({ node, level }) => (
            <FamilleRow key={node.idFamille} node={node} level={level} {...props} />
          ))}
        </div>
      )}
    </>
  );
}