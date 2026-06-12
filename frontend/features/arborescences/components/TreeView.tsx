'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Boxes,
  Building,
  ChevronDown,
  ChevronRight,
  FolderTree,
  HardDrive,
  MapPin,
  Package,
  RefreshCcw,
  Search,
  Wrench,
} from 'lucide-react';

import {
  ArborescenceMode,
  ArborescenceNode,
} from '../types/arborescence.types';

type Props = {
  data: ArborescenceNode[];
  mode: ArborescenceMode;
};

function getNodeIcon(type?: string | null) {
  switch (type) {
    case 'ROOT':
      return {
        icon: <FolderTree size={18} />,
        iconClass: 'bg-[#06475a] text-white',
      };

    case 'FAMILLE':
      return {
        icon: <Boxes size={18} />,
        iconClass: 'bg-violet-50 text-violet-700',
      };

    case 'MODELE':
      return {
        icon: <Box size={18} />,
        iconClass: 'bg-blue-50 text-blue-700',
      };

    case 'ARTICLE':
      return {
        icon: <Package size={18} />,
        iconClass: 'bg-emerald-50 text-emerald-700',
      };

    case 'MATERIEL':
      return {
        icon: <HardDrive size={18} />,
        iconClass: 'bg-orange-50 text-orange-700',
      };

    case 'POINT_STRUCTURE':
      return {
        icon: <MapPin size={18} />,
        iconClass: 'bg-cyan-50 text-cyan-700',
      };

    default:
      return {
        icon: <Wrench size={18} />,
        iconClass: 'bg-slate-100 text-slate-500',
      };
  }
}

function getModeLabel(mode: ArborescenceMode) {
  if (mode === 'GEOGRAPHIQUE') return 'Arborescence géographique';
  if (mode === 'TECHNIQUE') return 'Arborescence technique';
  return 'Arborescence familles';
}

function getModeIcon(mode: ArborescenceMode) {
  if (mode === 'GEOGRAPHIQUE') return <Building size={24} />;
  if (mode === 'TECHNIQUE') return <Wrench size={24} />;
  return <FolderTree size={24} />;
}

function getChildren(node: ArborescenceNode) {
  return node.children ?? [];
}

function removeGroupNodes(nodes: ArborescenceNode[]): ArborescenceNode[] {
  return nodes.flatMap((node) => {
    const children = removeGroupNodes(getChildren(node));

    if (node.type === 'GROUP_MODELES' || node.type === 'GROUP_ARTICLES') {
      return children;
    }

    return [
      {
        ...node,
        children,
      },
    ];
  });
}

function getNodeLabel(node: ArborescenceNode) {
  return node.libelle || node.code || `Élément ${node.id}`;
}

function getNodeKey(node: ArborescenceNode) {
  return node.key || `${node.type}-${node.id}`;
}

function getNodeHref(node: ArborescenceNode) {
  switch (node.type) {
    case 'FAMILLE':
      return `/familles/${node.id}`;

    case 'MODELE':
      return `/modeles/${node.id}`;

    case 'ARTICLE':
      return `/articles/${node.id}`;

    case 'MATERIEL':
      return `/materiels/${node.id}`;

    case 'POINT_STRUCTURE':
      return `/points-structure/${node.id}`;

    default:
      return null;
  }
}

function filterTree(
  nodes: ArborescenceNode[],
  search: string,
): ArborescenceNode[] {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) return nodes;

  return nodes
    .map((node) => {
      const children = filterTree(getChildren(node), search);

      const currentMatch = [node.code, node.libelle, node.type]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );

      if (currentMatch || children.length > 0) {
        return {
          ...node,
          children,
        };
      }

      return null;
    })
    .filter((node): node is ArborescenceNode => Boolean(node));
}

export default function TreeView({ data, mode }: Props) {
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const normalizedData = useMemo(() => {
    return removeGroupNodes(data);
  }, [data]);

  useEffect(() => {
    const initial = new Set<string>();

    function collect(nodes: ArborescenceNode[], level = 0) {
      for (const node of nodes) {
        if (level <= 2) {
          initial.add(getNodeKey(node));
        }

        collect(getChildren(node), level + 1);
      }
    }

    collect(normalizedData);
    setExpandedKeys(initial);
  }, [normalizedData]);

  const filteredData = useMemo(() => {
    return filterTree(normalizedData, search);
  }, [normalizedData, search]);

  function toggleNode(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-xl">
          <Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par libellé..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10"
          />
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCcw size={18} />
          Actualiser
        </button>
      </div>

      <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-[#06475a]">
            {getModeIcon(mode)}
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-950">
              {getModeLabel(mode)}
            </h3>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-400">
            Aucun élément trouvé.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map((node) => (
              <TreeNodeRow
                key={getNodeKey(node)}
                node={node}
                level={0}
                expandedKeys={expandedKeys}
                onToggle={toggleNode}
                forceExpanded={Boolean(search.trim())}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNodeRow({
  node,
  level,
  expandedKeys,
  onToggle,
  forceExpanded,
}: {
  node: ArborescenceNode;
  level: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  forceExpanded: boolean;
}) {
  const router = useRouter();

  const children = getChildren(node);
  const key = getNodeKey(node);
  const hasChildren = children.length > 0;
  const isExpanded = forceExpanded || expandedKeys.has(key);
  const visual = getNodeIcon(node.type);
  const href = getNodeHref(node);

  function handleOpen() {
    if (!href) return;
    router.push(href);
  }

  return (
    <div className="space-y-2">
      <div
        role={href ? 'button' : undefined}
        tabIndex={href ? 0 : undefined}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (!href) return;

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            router.push(href);
          }
        }}
        className={[
          'rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:bg-slate-50',
          href ? 'cursor-pointer hover:border-[#06475a]/30' : '',
        ].join(' ')}
        style={{ marginLeft: level > 0 ? Math.min(level * 30, 120) : 0 }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!hasChildren}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(key);
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              hasChildren
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-50 text-slate-300'
            }`}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-300" />
            )}
          </button>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${visual.iconClass}`}
          >
            {visual.icon}
          </div>

          <p className="min-w-0 flex-1 break-words text-sm font-black text-slate-950">
            {getNodeLabel(node)}
          </p>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {children.map((child) => (
            <TreeNodeRow
              key={getNodeKey(child)}
              node={child}
              level={level + 1}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}