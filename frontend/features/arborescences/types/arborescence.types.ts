export type ArborescenceMode = 'GEOGRAPHIQUE' | 'TECHNIQUE' | 'FAMILLE';

export type ArborescenceNodeType =
  | 'ROOT'
  | 'POINT_STRUCTURE'
  | 'MATERIEL'
  | 'FAMILLE'
  | 'MODELE'
  | 'ARTICLE'
  | 'GROUP_MODELES'
  | 'GROUP_ARTICLES';



export type ArborescenceNode = {
  key: string;
  id: number;
  type: ArborescenceNodeType;
  code: string | null;
  libelle: string | null;
  typePoint?: 'GEOGRAPHIQUE' | 'TECHNIQUE' | null;
  children: ArborescenceNode[];

  meta?: {
    sousFamilles?: number;
    modeles?: number;
    articles?: number;
    gereEnStock?: boolean;
    serialise?: boolean;
    reparable?: boolean;
  };
};