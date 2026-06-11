/*'use client';

import { Boxes, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Article } from '../types/article';

type Props = {
  data: Article[];
  onCreate: () => void;
  onEdit: (id: number) => void;
  onRemove: (id: number) => void;
};

export function ArticleTable({ data, onCreate, onEdit, onRemove }: Props) {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;

    return data.filter(
      (item) =>
        item.reference?.toLowerCase().includes(q) ||
        item.designation?.toLowerCase().includes(q) ||
        item.famille?.libelle?.toLowerCase().includes(q) ||
        item.modele?.libelle?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0f3d56]">
            <Boxes size={26} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
              Module stock
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Articles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gérez les articles stockables, sérialisés ou consommables.
            </p>
          </div>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0f3d56] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0b3044]"
        >
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center">
        <div className="relative w-full max-w-xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          {filteredData.length} résultat(s)
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[11%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-100 bg-white text-left">
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Référence
              </th>

              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Libellé
              </th>

              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Famille
              </th>

              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Unité
              </th>

              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Modèle
              </th>

              <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Paramètres
              </th>

              <th className="px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
  Actions
</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.idArticle}
                className="border-b border-slate-100 transition hover:bg-slate-50/80"
              >
                <td className="px-4 py-5">
                  <span className="block truncate rounded-full bg-sky-50 px-4 py-2 text-center text-sm font-bold text-[#0f3d56]">
                    {item.reference ?? '—'}
                  </span>
                </td>

                <td className="px-4 py-5">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                    {item.designation ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {item.famille?.libelle ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <p className="truncate text-sm text-slate-600">
                    {item.uniteArticle?.code ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <p className="truncate text-sm text-slate-600">
                    {item.modele?.code ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <div className="flex flex-wrap gap-2">
                    {item.gereEnStock && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Stock
                      </span>
                    )}

                    {item.serialise && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                        Sérialisé
                      </span>
                    )}

                    {item.reparable && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Réparable
                      </span>
                    )}

                    {!item.actif && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Inactif
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(item.idArticle)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => onRemove(item.idArticle)}
                      className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  Aucun article trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}*/