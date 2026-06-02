export type ArborescenceMode = 'GEOGRAPHIQUE' | 'TECHNIQUE';

export type ArborescenceNode = {
  key: string;
  id: number;
  type: 'POINT_STRUCTURE' | 'MATERIEL';
  code: string | null;
  libelle: string | null;
  typePoint?: 'GEOGRAPHIQUE' | 'TECHNIQUE' | null;
  children: ArborescenceNode[];
};