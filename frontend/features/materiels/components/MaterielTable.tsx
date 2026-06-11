/*'use client';

import {
  Eye,
  HardDrive,
  MapPin,
  Package,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Materiel } from '../types/materiel';

type Props = {
  materiels: Materiel[];
  loading?: boolean;
  onView: (materiel: Materiel) => void;
  onEdit: (materiel: Materiel) => void;
  onDelete: (materiel: Materiel) => void;
};

function getArticleLabel(materiel: Materiel) {
  return (
    materiel.article?.reference ||
    materiel.article?.code ||
    materiel.article?.designation ||
    materiel.article?.libelle ||
    '-'
  );
}

function getModeleLabel(materiel: Materiel) {
  if (!materiel.modele) return '-';

  if (materiel.modele.code && materiel.modele.libelle) {
    return `${materiel.modele.code} - ${materiel.modele.libelle}`;
  }

  return materiel.modele.code || materiel.modele.libelle || '-';
}

function getEmplacementLabel(materiel: Materiel) {
  const point = materiel.point_structure;

  if (!point) return 'Non affecté';

  if (point.code && point.libelle) {
    return `${point.code} - ${point.libelle}`;
  }

  return point.code || point.libelle || 'Non affecté';
}

export function MaterielTable({
  materiels,
  loading = false,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
          <HardDrive size={28} />
        </div>

        <p className="font-semibold text-slate-700">
          Chargement des matériels...
        </p>
      </div>
    );
  }

  if (materiels.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-500">
          <HardDrive size={32} />
        </div>

        <h3 className="text-xl font-black text-slate-900">
          Aucun matériel trouvé
        </h3>

        <p className="mt-2 text-slate-500">
          Créez votre premier matériel pour commencer à suivre son cycle de vie.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <HardDrive size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Liste des matériels
            </h2>
            <p className="text-sm text-slate-500">
              {materiels.length} matériel{materiels.length > 1 ? 's' : ''} enregistré
              {materiels.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Matériel</th>
              <th className="px-6 py-4">N° série</th>
              <th className="px-6 py-4">Article</th>
              <th className="px-6 py-4">Modèle</th>
              <th className="px-6 py-4">Emplacement</th>
              <th className="px-6 py-4">État</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {materiels.map((materiel) => (
              <tr
                key={materiel.idMateriel}
                className="transition hover:bg-slate-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                      <HardDrive size={20} />
                    </div>

                    <div>
                      <p className="font-black text-slate-900">
                        {materiel.code || 'Sans code'}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID : {materiel.idMateriel}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {materiel.numeroSerie || '-'}
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex max-w-[180px] items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    <Package size={15} />
                    <span className="truncate">{getArticleLabel(materiel)}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {getModeleLabel(materiel)}
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex max-w-[240px] items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    <MapPin size={15} />
                    <span className="truncate">
                      {getEmplacementLabel(materiel)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {materiel.etat_materiel?.libelle ||
                    materiel.etat_materiel?.code ||
                    '-'}
                </td>

                <td className="px-6 py-4">
                  {materiel.actif ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
                      Inactif
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(materiel)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      title="Voir"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(materiel)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(materiel)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}*/