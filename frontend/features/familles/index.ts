export { default as FamilleTable } from './components/famille-table';
export { default as FamilleDetailCard } from './components/famille-detail-card';
export { default as FamilleForm } from './components/famille-form';
export { default as FamilleToolbar } from './components/famille-toolbar';
export { default as ModeleList } from './components/modele-list';

export { useFamilles } from './hooks/useFamilles';
export { useFamilleDetail } from './hooks/useFamilleDetail';
export { useFamilleForm } from './hooks/useFamilleForm';
export { useEditFamilleForm } from './hooks/useEditFamilleForm';

export type {
  FamilleApi,
  FamilleFormValues,
  FamilleFilterType,
  TypeFamille,
  NatureAchatFamille,
} from './types/famille';