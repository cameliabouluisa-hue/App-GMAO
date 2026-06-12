import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AffecterMaterielDto } from './dto/affecter-materiel.dto';
import { CreateLienArborescenceDto } from './dto/create-lien-arborescence.dto';
import { MoveNodeDto } from './dto/move-node.dto';

type TypeArborescence = 'GEOGRAPHIQUE' | 'TECHNIQUE' | 'MATERIEL';
type NodeType = 'ROOT' | 'POINT_STRUCTURE' | 'MATERIEL';

export type TreeNode = {
  key: string;
  id: number;
  type: NodeType;
  code: string | null;
  libelle: string | null;
  typePoint?: string | null;
  children: TreeNode[];
};

@Injectable()
export class ArborescenceService {
  constructor(private readonly prisma: PrismaService) {}

  /* =====================================================
     AFFECTATION MATÉRIEL
  ===================================================== */

  async affecterMateriel(dto: AffecterMaterielDto) {
   const typeArborescence = this.assertTypeArborescence(
  dto.typeArborescence ?? 'GEOGRAPHIQUE',
);

    const materiel = await this.prisma.materiel.findUnique({
      where: { idMateriel: dto.idMateriel },
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }

    const point = await this.prisma.point_structure.findUnique({
      where: { idPoint: dto.idPoint },
    });

    if (!point) {
      throw new NotFoundException('Point de structure introuvable.');
    }

    if (
      typeArborescence !== 'MATERIEL' &&
      point.typePoint !== typeArborescence
    ) {
      throw new BadRequestException(
        `Le point sélectionné est de type ${point.typePoint}, pas ${typeArborescence}.`,
      );
    }

    if (typeArborescence === 'GEOGRAPHIQUE') {
      await this.prisma.materiel.update({
        where: { idMateriel: dto.idMateriel },
        data: {
          idPointStructure: dto.idPoint,
        },
      });
    }

    const lienExistant = await this.prisma.lien_arborescence.findFirst({
      where: {
        typeArborescence,
        enfantType: 'MATERIEL',
        enfantMaterielId: dto.idMateriel,
        actif: true,
      },
    });

    if (lienExistant) {
      throw new BadRequestException(
        'Ce matériel est déjà affecté dans cette arborescence.',
      );
    }

    return this.prisma.lien_arborescence.create({
      data: {
        typeArborescence,
        parentType: 'POINT_STRUCTURE',
        parentPointId: dto.idPoint,
        parentMaterielId: null,
        enfantType: 'MATERIEL',
        enfantPointId: null,
        enfantMaterielId: dto.idMateriel,
        ordre: dto.ordre ?? null,
        actif: true,
      },
    });
  }

  async desaffecterMateriel(
    idMateriel: number,
    typeArborescence?: string,
  ) {
    const type = typeArborescence
      ? this.assertTypeArborescence(typeArborescence)
      : undefined;

    const materiel = await this.prisma.materiel.findUnique({
      where: { idMateriel },
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }

    if (!type || type === 'GEOGRAPHIQUE') {
      await this.prisma.materiel.update({
        where: { idMateriel },
        data: {
          idPointStructure: null,
        },
      });
    }

    await this.prisma.lien_arborescence.updateMany({
      where: {
        enfantType: 'MATERIEL',
        enfantMaterielId: idMateriel,
        actif: true,
        ...(type ? { typeArborescence: type } : {}),
      },
      data: {
        actif: false,
      },
    });

    return {
      message: 'Matériel désaffecté avec succès.',
    };
  }

  async positionMateriel(idMateriel: number) {
    const materiel = await this.prisma.materiel.findUnique({
      where: { idMateriel },
      include: {
        point_structure: true,
        materielParent: true,
      },
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }

    const liens = await this.prisma.lien_arborescence.findMany({
      where: {
        enfantType: 'MATERIEL',
        enfantMaterielId: idMateriel,
        actif: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      materiel,
      positionGeographique: materiel.point_structure,
      parentMateriel: materiel.materielParent,
      liens,
    };
  }

  /* =====================================================
     CRUD LIENS
  ===================================================== */

  async createLien(dto: CreateLienArborescenceDto) {
    const typeArborescence = this.assertTypeArborescence(
      dto.typeArborescence,
    );

    await this.validateLien({
      ...dto,
      typeArborescence,
    });

    await this.assertNoCycle({
      ...dto,
      typeArborescence,
    });

    const lienExistant = await this.prisma.lien_arborescence.findFirst({
      where: {
        typeArborescence,
        parentType: dto.parentType,
        parentPointId: dto.parentPointId ?? null,
        parentMaterielId: dto.parentMaterielId ?? null,
        enfantType: dto.enfantType,
        enfantPointId: dto.enfantPointId ?? null,
        enfantMaterielId: dto.enfantMaterielId ?? null,
      },
    });

    if (lienExistant?.actif) {
      throw new BadRequestException('Ce lien existe déjà.');
    }

    if (lienExistant && !lienExistant.actif) {
      const lien = await this.prisma.lien_arborescence.update({
        where: { idLien: lienExistant.idLien },
        data: {
          actif: true,
          ordre: dto.ordre ?? null,
        },
      });

      await this.synchroniserLienAvecMateriel(typeArborescence, dto);

      return lien;
    }

    const lien = await this.prisma.lien_arborescence.create({
      data: {
        typeArborescence,
        parentType: dto.parentType,
        parentPointId: dto.parentPointId ?? null,
        parentMaterielId: dto.parentMaterielId ?? null,
        enfantType: dto.enfantType,
        enfantPointId: dto.enfantPointId ?? null,
        enfantMaterielId: dto.enfantMaterielId ?? null,
        ordre: dto.ordre ?? null,
        actif: true,
      },
    });

    await this.synchroniserLienAvecMateriel(typeArborescence, dto);

    return lien;
  }

  async deleteLien(id: number) {
    const lien = await this.prisma.lien_arborescence.findUnique({
      where: { idLien: id },
    });

    if (!lien) {
      throw new NotFoundException('Lien introuvable.');
    }

    return this.prisma.lien_arborescence.update({
      where: { idLien: id },
      data: {
        actif: false,
      },
    });
  }

  async moveNode(dto: MoveNodeDto) {
    const typeArborescence = this.assertTypeArborescence(
      dto.typeArborescence,
    );

    const enfantType = dto.enfantType as 'POINT_STRUCTURE' | 'MATERIEL';
    const nouveauParentType = dto.nouveauParentType as
      | 'POINT_STRUCTURE'
      | 'MATERIEL';

    await this.validateLien({
      typeArborescence,
      parentType: nouveauParentType,
      parentPointId: dto.nouveauParentPointId,
      parentMaterielId: dto.nouveauParentMaterielId,
      enfantType,
      enfantPointId: dto.enfantPointId,
      enfantMaterielId: dto.enfantMaterielId,
    });

    await this.assertNoCycle({
      typeArborescence,
      parentType: nouveauParentType,
      parentPointId: dto.nouveauParentPointId,
      parentMaterielId: dto.nouveauParentMaterielId,
      enfantType,
      enfantPointId: dto.enfantPointId,
      enfantMaterielId: dto.enfantMaterielId,
    });

    await this.prisma.lien_arborescence.updateMany({
      where: {
        typeArborescence,
        enfantType,
        enfantPointId: dto.enfantPointId ?? null,
        enfantMaterielId: dto.enfantMaterielId ?? null,
        actif: true,
      },
      data: {
        actif: false,
      },
    });

    const nouveauLien = await this.prisma.lien_arborescence.create({
      data: {
        typeArborescence,
        parentType: nouveauParentType,
        parentPointId: dto.nouveauParentPointId ?? null,
        parentMaterielId: dto.nouveauParentMaterielId ?? null,
        enfantType,
        enfantPointId: dto.enfantPointId ?? null,
        enfantMaterielId: dto.enfantMaterielId ?? null,
        actif: true,
      },
    });

  await this.synchroniserLienAvecMateriel(typeArborescence, {
  parentType: nouveauParentType,
  parentPointId: dto.nouveauParentPointId,
  parentMaterielId: dto.nouveauParentMaterielId,
  enfantType,
  enfantMaterielId: dto.enfantMaterielId,
});

    return nouveauLien;
  }

  /* =====================================================
     TREES PUBLICS
  ===================================================== */
async getFamillesTree() {
  type FamilleNodeType =
    | 'ROOT'
    | 'FAMILLE'
    | 'MODELE'
    | 'ARTICLE'
    | 'GROUP_MODELES'
    | 'GROUP_ARTICLES';

  type FamilleNode = {
    key: string;
    id: number;
    type: FamilleNodeType;
    code: string | null;
    libelle: string | null;
    children: FamilleNode[];
  };

  const familles = await this.prisma.famille.findMany({
    where: {
      actif: true,
    },
    orderBy: [{ libelle: 'asc' }, { idFamille: 'asc' }],
  });

  const modeles = await this.prisma.modele.findMany({
    where: {
      idFamille: {
        not: null,
      },
    },
    orderBy: [{ libelle: 'asc' }, { code: 'asc' }],
  });

  const articles = await this.prisma.article.findMany({
    where: {
      idFamille: {
        not: null,
      },
    },
    orderBy: [{ designation: 'asc' }, { reference: 'asc' }],
  });

  const familleMap = new Map<number, (typeof familles)[number]>();
  const childrenByParent = new Map<number, number[]>();
  const modelesByFamille = new Map<number, typeof modeles>();
  const articlesByFamille = new Map<number, typeof articles>();

  for (const famille of familles) {
    familleMap.set(famille.idFamille, famille);

    if (famille.parent_id) {
      if (!childrenByParent.has(famille.parent_id)) {
        childrenByParent.set(famille.parent_id, []);
      }

      childrenByParent.get(famille.parent_id)!.push(famille.idFamille);
    }
  }

  for (const modele of modeles) {
    if (!modele.idFamille) continue;

    if (!modelesByFamille.has(modele.idFamille)) {
      modelesByFamille.set(modele.idFamille, []);
    }

    modelesByFamille.get(modele.idFamille)!.push(modele);
  }

  for (const article of articles) {
    const item = article as any;

    if (!item.idFamille) continue;

    if (!articlesByFamille.has(item.idFamille)) {
      articlesByFamille.set(item.idFamille, []);
    }

    articlesByFamille.get(item.idFamille)!.push(article);
  }

  const buildFamilleNode = (
    idFamille: number,
    visited = new Set<number>(),
  ): FamilleNode | null => {
    const famille = familleMap.get(idFamille);

    if (!famille) return null;

    if (visited.has(idFamille)) {
      return {
        key: `FAMILLE-${famille.idFamille}`,
        id: famille.idFamille,
        type: 'FAMILLE',
        code: famille.code,
        libelle: famille.libelle,
        children: [],
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(idFamille);

    const sousFamilles = (childrenByParent.get(idFamille) ?? [])
      .map((childId) => buildFamilleNode(childId, nextVisited))
      .filter((node): node is FamilleNode => Boolean(node));

    const modeleNodes: FamilleNode[] = (
      modelesByFamille.get(idFamille) ?? []
    ).map((modele) => ({
      key: `MODELE-${modele.idModele}`,
      id: modele.idModele,
      type: 'MODELE',
      code: modele.code,
      libelle: modele.libelle || modele.code || `Modèle ${modele.idModele}`,
      children: [],
    }));

    const articleNodes: FamilleNode[] = (
      articlesByFamille.get(idFamille) ?? []
    ).map((article) => {
      const item = article as any;

      return {
        key: `ARTICLE-${item.idArticle}`,
        id: item.idArticle,
        type: 'ARTICLE',
        code: item.reference || item.code || `ART-${item.idArticle}`,
        libelle:
          item.designation ||
          item.libelle ||
          item.reference ||
          item.code ||
          `Article ${item.idArticle}`,
        children: [],
      };
    });

   return {
  key: `FAMILLE-${famille.idFamille}`,
  id: famille.idFamille,
  type: 'FAMILLE',
  code: famille.code,
  libelle: famille.libelle,
  children: [
    ...sousFamilles,
    ...modeleNodes,
    ...articleNodes,
  ],
};
  };

  const racinesFamilles = familles
    .filter(
      (famille) =>
        !famille.parent_id || !familleMap.has(famille.parent_id),
    )
    .map((famille) => buildFamilleNode(famille.idFamille))
    .filter((node): node is FamilleNode => Boolean(node));

  return [
    {
      key: 'ROOT-FAMILLES-BMT',
      id: 0,
      type: 'ROOT',
      code: 'BMT',
      libelle: 'BMT',
      children: racinesFamilles,
    },
  ];
}
  async getGeographiqueTree(): Promise<TreeNode[]> {
    const children = await this.buildPointStructureTree('GEOGRAPHIQUE');

    return [this.createRootNode(children)];
  }

  async getTechniqueTree(): Promise<TreeNode[]> {
    const children = await this.buildPointStructureTree('TECHNIQUE');

    return [this.createRootNode(children)];
  }
  async getMaterielTree(): Promise<TreeNode[]> {
  const materiels = await this.prisma.materiel.findMany({
    where: {
      actif: true,
    },
    orderBy: [{ code: 'asc' }, { idMateriel: 'asc' }],
  });

  const materielMap = new Map<number, (typeof materiels)[number]>();
  const childrenByParent = new Map<number, number[]>();

  for (const materiel of materiels) {
    materielMap.set(materiel.idMateriel, materiel);

    if (materiel.idMaterielParent) {
      if (!childrenByParent.has(materiel.idMaterielParent)) {
        childrenByParent.set(materiel.idMaterielParent, []);
      }

      childrenByParent
        .get(materiel.idMaterielParent)!
        .push(materiel.idMateriel);
    }
  }

  const buildMaterielNode = (
    idMateriel: number,
    visited = new Set<number>(),
  ): TreeNode | null => {
    const materiel = materielMap.get(idMateriel);

    if (!materiel) return null;

    if (visited.has(idMateriel)) {
      return {
        key: `MATERIEL-${materiel.idMateriel}`,
        id: materiel.idMateriel,
        type: 'MATERIEL',
        code: materiel.code,
        libelle: materiel.libelle ?? materiel.numeroSerie ?? materiel.code,
        children: [],
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(idMateriel);

    const childIds = [
      ...new Set(childrenByParent.get(idMateriel) ?? []),
    ];

    const children = childIds
      .map((childId) => buildMaterielNode(childId, nextVisited))
      .filter((node): node is TreeNode => Boolean(node));

    return {
      key: `MATERIEL-${materiel.idMateriel}`,
      id: materiel.idMateriel,
      type: 'MATERIEL',
      code: materiel.code,
      libelle: materiel.libelle ?? materiel.numeroSerie ?? materiel.code,
      children,
    };
  };

  const roots = materiels
    .filter(
      (materiel) =>
        !materiel.idMaterielParent ||
        !materielMap.has(materiel.idMaterielParent),
    )
    .map((materiel) => buildMaterielNode(materiel.idMateriel))
    .filter((node): node is TreeNode => Boolean(node));

  return [
    {
      key: 'ROOT-MATERIEL',
      id: 0,
      type: 'ROOT',
      code: 'BMT',
      libelle: 'BMT',
      typePoint: 'MATERIEL',
      children: roots,
    },
  ];
}

 private async getMergedTree(
  rootType: 'GEOGRAPHIQUE' | 'TECHNIQUE',
): Promise<TreeNode[]> {
  const [points, liens, materiels] = await Promise.all([
    this.prisma.point_structure.findMany({
      where: {
        typePoint: rootType,
        actif: true,
      },
      orderBy: [{ code: 'asc' }, { idPoint: 'asc' }],
    }),

    this.prisma.lien_arborescence.findMany({
      where: {
        typeArborescence: rootType,
        actif: true,
      },
      orderBy: [{ ordre: 'asc' }, { idLien: 'asc' }],
    }),

    this.prisma.materiel.findMany({
      where: {
        actif: true,
      },
      orderBy: [{ code: 'asc' }, { idMateriel: 'asc' }],
    }),
  ]);

  const pointMap = new Map<number, any>();
  const materielMap = new Map<number, any>();

  for (const point of points) {
    pointMap.set(point.idPoint, point);
  }

  for (const materiel of materiels) {
    materielMap.set(materiel.idMateriel, materiel);
  }

  const pointChildrenMap = new Map<number, number[]>();
  const pointParentIds = new Set<number>();

  const materielsByPoint = new Map<number, number[]>();
  const materielChildrenMap = new Map<number, number[]>();

  for (const lien of liens) {
    if (
      lien.parentType === 'POINT_STRUCTURE' &&
      lien.enfantType === 'POINT_STRUCTURE' &&
      lien.parentPointId &&
      lien.enfantPointId &&
      pointMap.has(lien.parentPointId) &&
      pointMap.has(lien.enfantPointId)
    ) {
      if (!pointChildrenMap.has(lien.parentPointId)) {
        pointChildrenMap.set(lien.parentPointId, []);
      }

      pointChildrenMap.get(lien.parentPointId)!.push(lien.enfantPointId);
      pointParentIds.add(lien.enfantPointId);
    }

    if (
      rootType === 'TECHNIQUE' &&
      lien.parentType === 'POINT_STRUCTURE' &&
      lien.enfantType === 'MATERIEL' &&
      lien.parentPointId &&
      lien.enfantMaterielId &&
      pointMap.has(lien.parentPointId) &&
      materielMap.has(lien.enfantMaterielId)
    ) {
      if (!materielsByPoint.has(lien.parentPointId)) {
        materielsByPoint.set(lien.parentPointId, []);
      }

      materielsByPoint.get(lien.parentPointId)!.push(lien.enfantMaterielId);
    }
  }

  for (const materiel of materiels) {
    if (materiel.idMaterielParent) {
      if (!materielChildrenMap.has(materiel.idMaterielParent)) {
        materielChildrenMap.set(materiel.idMaterielParent, []);
      }

      materielChildrenMap
        .get(materiel.idMaterielParent)!
        .push(materiel.idMateriel);
    }
  }

  if (rootType === 'GEOGRAPHIQUE') {
    for (const materiel of materiels) {
      if (!materiel.idPointStructure) continue;
      if (!pointMap.has(materiel.idPointStructure)) continue;

      const isSousMateriel =
        materiel.idMaterielParent &&
        materielMap.has(materiel.idMaterielParent);

      if (isSousMateriel) continue;

      if (!materielsByPoint.has(materiel.idPointStructure)) {
        materielsByPoint.set(materiel.idPointStructure, []);
      }

      materielsByPoint
        .get(materiel.idPointStructure)!
        .push(materiel.idMateriel);
    }
  }

  const buildMaterielNode = (
    idMateriel: number,
    visited = new Set<number>(),
  ): TreeNode | null => {
    const materiel = materielMap.get(idMateriel);

    if (!materiel) return null;

    if (visited.has(idMateriel)) {
      return {
        key: `MATERIEL-${materiel.idMateriel}`,
        id: materiel.idMateriel,
        type: 'MATERIEL',
        code: materiel.code,
        libelle: materiel.libelle ?? materiel.numeroSerie ?? materiel.code,
        children: [],
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(idMateriel);

    const childIds = [...new Set(materielChildrenMap.get(idMateriel) ?? [])];

    const children = childIds
      .map((childId) => buildMaterielNode(childId, nextVisited))
      .filter((node): node is TreeNode => Boolean(node));

    return {
      key: `MATERIEL-${materiel.idMateriel}`,
      id: materiel.idMateriel,
      type: 'MATERIEL',
      code: materiel.code,
      libelle: materiel.libelle ?? materiel.numeroSerie ?? materiel.code,
      children,
    };
  };

  const buildPointNode = (
    idPoint: number,
    visited = new Set<number>(),
  ): TreeNode | null => {
    const point = pointMap.get(idPoint);

    if (!point) return null;

    if (visited.has(idPoint)) {
      return {
        key: `POINT_STRUCTURE-${point.idPoint}`,
        id: point.idPoint,
        type: 'POINT_STRUCTURE',
        code: point.code,
        libelle: point.libelle,
        typePoint: point.typePoint,
        children: [],
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(idPoint);

    const pointChildIds = [...new Set(pointChildrenMap.get(idPoint) ?? [])];

    const pointChildren = pointChildIds
      .map((childId) => buildPointNode(childId, nextVisited))
      .filter((node): node is TreeNode => Boolean(node));

    const materielChildIds = [...new Set(materielsByPoint.get(idPoint) ?? [])];

    const materielChildren = materielChildIds
      .map((idMateriel) => buildMaterielNode(idMateriel))
      .filter((node): node is TreeNode => Boolean(node));

    return {
      key: `POINT_STRUCTURE-${point.idPoint}`,
      id: point.idPoint,
      type: 'POINT_STRUCTURE',
      code: point.code,
      libelle: point.libelle,
      typePoint: point.typePoint,
      children: [...pointChildren, ...materielChildren],
    };
  };

  const rootPointIds = points
    .filter((point) => !pointParentIds.has(point.idPoint))
    .map((point) => point.idPoint);

  const children = rootPointIds
    .map((idPoint) => buildPointNode(idPoint))
    .filter((node): node is TreeNode => Boolean(node));

  return [
    {
      key: `ROOT-${rootType}`,
      id: 0,
      type: 'ROOT',
      code: 'BMT',
      libelle: 'BMT',
      typePoint: rootType,
      children,
    },
  ];
}

  /* =====================================================
     CONSTRUCTION ARBORESCENCE GÉO / TECHNIQUE
  ===================================================== */

  private async buildPointStructureTree(
    typePoint: 'GEOGRAPHIQUE' | 'TECHNIQUE',
  ): Promise<TreeNode[]> {
    const typeArborescence = typePoint;

    const [points, liens, materiels] = await Promise.all([
      this.prisma.point_structure.findMany({
        where: {
          typePoint,
          actif: true,
        },
        orderBy: [{ code: 'asc' }, { idPoint: 'asc' }],
      }),

      this.prisma.lien_arborescence.findMany({
        where: {
          typeArborescence,
          actif: true,
        },
        orderBy: [{ ordre: 'asc' }, { idLien: 'asc' }],
      }),

      this.prisma.materiel.findMany({
        where: {
          actif: true,
        },
        orderBy: [{ code: 'asc' }, { idMateriel: 'asc' }],
      }),
    ]);

    const pointMap = new Map<number, any>();
    const materielMap = new Map<number, any>();

    for (const point of points) {
      pointMap.set(point.idPoint, point);
    }

    for (const materiel of materiels) {
      materielMap.set(materiel.idMateriel, materiel);
    }

    const pointChildrenMap = new Map<number, number[]>();
    const pointParentIds = new Set<number>();

    const directMaterielsByPoint = new Map<number, number[]>();
    const materielChildrenByParent = new Map<number, number[]>();

    for (const materiel of materiels) {
      if (materiel.idMaterielParent) {
        if (!materielChildrenByParent.has(materiel.idMaterielParent)) {
          materielChildrenByParent.set(materiel.idMaterielParent, []);
        }

        materielChildrenByParent
          .get(materiel.idMaterielParent)!
          .push(materiel.idMateriel);
      }
    }

    for (const lien of liens) {
      if (
        lien.parentType === 'POINT_STRUCTURE' &&
        lien.enfantType === 'POINT_STRUCTURE' &&
        lien.parentPointId &&
        lien.enfantPointId &&
        pointMap.has(lien.parentPointId) &&
        pointMap.has(lien.enfantPointId)
      ) {
        if (!pointChildrenMap.has(lien.parentPointId)) {
          pointChildrenMap.set(lien.parentPointId, []);
        }

        pointChildrenMap.get(lien.parentPointId)!.push(lien.enfantPointId);
        pointParentIds.add(lien.enfantPointId);
      }

      if (
        typePoint === 'TECHNIQUE' &&
        lien.parentType === 'POINT_STRUCTURE' &&
        lien.enfantType === 'MATERIEL' &&
        lien.parentPointId &&
        lien.enfantMaterielId &&
        pointMap.has(lien.parentPointId) &&
        materielMap.has(lien.enfantMaterielId)
      ) {
        if (!directMaterielsByPoint.has(lien.parentPointId)) {
          directMaterielsByPoint.set(lien.parentPointId, []);
        }

        directMaterielsByPoint
          .get(lien.parentPointId)!
          .push(lien.enfantMaterielId);
      }

      if (
        lien.parentType === 'MATERIEL' &&
        lien.enfantType === 'MATERIEL' &&
        lien.parentMaterielId &&
        lien.enfantMaterielId &&
        materielMap.has(lien.parentMaterielId) &&
        materielMap.has(lien.enfantMaterielId)
      ) {
        if (!materielChildrenByParent.has(lien.parentMaterielId)) {
          materielChildrenByParent.set(lien.parentMaterielId, []);
        }

        materielChildrenByParent
          .get(lien.parentMaterielId)!
          .push(lien.enfantMaterielId);
      }
    }

    if (typePoint === 'GEOGRAPHIQUE') {
      for (const materiel of materiels) {
        if (!materiel.idPointStructure) continue;
        if (!pointMap.has(materiel.idPointStructure)) continue;

        const parentExiste = materiel.idMaterielParent
          ? materielMap.has(materiel.idMaterielParent)
          : false;

        if (parentExiste) continue;

        if (!directMaterielsByPoint.has(materiel.idPointStructure)) {
          directMaterielsByPoint.set(materiel.idPointStructure, []);
        }

        directMaterielsByPoint
          .get(materiel.idPointStructure)!
          .push(materiel.idMateriel);
      }
    }

    const buildMaterielNode = (
      idMateriel: number,
      visited = new Set<number>(),
    ): TreeNode | null => {
      const materiel = materielMap.get(idMateriel);

      if (!materiel) return null;

      if (visited.has(idMateriel)) {
        return this.toMaterielNode(materiel, []);
      }

      const nextVisited = new Set(visited);
      nextVisited.add(idMateriel);

      const childIds = [
        ...new Set(materielChildrenByParent.get(idMateriel) ?? []),
      ];

      const children = childIds
        .map((childId) => buildMaterielNode(childId, nextVisited))
        .filter((node): node is TreeNode => Boolean(node));

      return this.toMaterielNode(materiel, children);
    };

    const buildPointNode = (
      idPoint: number,
      visited = new Set<number>(),
    ): TreeNode | null => {
      const point = pointMap.get(idPoint);

      if (!point) return null;

      if (visited.has(idPoint)) {
        return this.toPointNode(point, []);
      }

      const nextVisited = new Set(visited);
      nextVisited.add(idPoint);

      const pointChildIds = [
        ...new Set(pointChildrenMap.get(idPoint) ?? []),
      ];

      const pointChildren = pointChildIds
        .map((childId) => buildPointNode(childId, nextVisited))
        .filter((node): node is TreeNode => Boolean(node));

      const materielChildIds = [
        ...new Set(directMaterielsByPoint.get(idPoint) ?? []),
      ];

      const materielChildren = materielChildIds
        .map((idMateriel) => buildMaterielNode(idMateriel))
        .filter((node): node is TreeNode => Boolean(node));

      return this.toPointNode(point, [...pointChildren, ...materielChildren]);
    };

    const rootPointIds = points
      .filter((point) => !pointParentIds.has(point.idPoint))
      .map((point) => point.idPoint);

    return rootPointIds
      .map((idPoint) => buildPointNode(idPoint))
      .filter((node): node is TreeNode => Boolean(node));
  }

  /* =====================================================
     VALIDATIONS
  ===================================================== */

  private async validateLien(dto: {
    typeArborescence: TypeArborescence;
    parentType: string;
    parentPointId?: number | null;
    parentMaterielId?: number | null;
    enfantType: string;
    enfantPointId?: number | null;
    enfantMaterielId?: number | null;
  }) {
    const parentType = dto.parentType as 'POINT_STRUCTURE' | 'MATERIEL';
    const enfantType = dto.enfantType as 'POINT_STRUCTURE' | 'MATERIEL';

    if (!['POINT_STRUCTURE', 'MATERIEL'].includes(parentType)) {
      throw new BadRequestException('Type du parent invalide.');
    }

    if (!['POINT_STRUCTURE', 'MATERIEL'].includes(enfantType)) {
      throw new BadRequestException("Type de l'enfant invalide.");
    }

    const parent = await this.getNode(
      parentType,
      dto.parentPointId ?? null,
      dto.parentMaterielId ?? null,
    );

    const enfant = await this.getNode(
      enfantType,
      dto.enfantPointId ?? null,
      dto.enfantMaterielId ?? null,
    );

    if (!parent) {
      throw new NotFoundException('Parent introuvable.');
    }

    if (!enfant) {
      throw new NotFoundException('Enfant introuvable.');
    }

    const parentKey = this.makeNodeKey(
      parentType,
      dto.parentPointId ?? null,
      dto.parentMaterielId ?? null,
    );

    const enfantKey = this.makeNodeKey(
      enfantType,
      dto.enfantPointId ?? null,
      dto.enfantMaterielId ?? null,
    );

    if (parentKey === enfantKey) {
      throw new BadRequestException(
        'Un nœud ne peut pas être parent de lui-même.',
      );
    }

    if (dto.typeArborescence === 'GEOGRAPHIQUE') {
      if (parentType !== 'POINT_STRUCTURE') {
        throw new BadRequestException(
          "Dans l'arborescence géographique, le parent doit être un point géographique.",
        );
      }

      const parentPoint = parent as { typePoint: string };

      if (parentPoint.typePoint !== 'GEOGRAPHIQUE') {
        throw new BadRequestException(
          'Le parent doit être un point de type GEOGRAPHIQUE.',
        );
      }

      if (enfantType === 'POINT_STRUCTURE') {
        const enfantPoint = enfant as { typePoint: string };

        if (enfantPoint.typePoint !== 'GEOGRAPHIQUE') {
          throw new BadRequestException(
            "Dans l'arborescence géographique, un sous-point doit aussi être GEOGRAPHIQUE.",
          );
        }
      }
    }

    if (dto.typeArborescence === 'TECHNIQUE') {
      if (parentType === 'POINT_STRUCTURE') {
        const parentPoint = parent as { typePoint: string };

        if (parentPoint.typePoint !== 'TECHNIQUE') {
          throw new BadRequestException(
            'Le parent doit être un point de type TECHNIQUE.',
          );
        }

        if (enfantType === 'POINT_STRUCTURE') {
          const enfantPoint = enfant as { typePoint: string };

          if (enfantPoint.typePoint !== 'TECHNIQUE') {
            throw new BadRequestException(
              "Dans l'arborescence technique, un sous-point doit aussi être TECHNIQUE.",
            );
          }
        }
      }

      if (parentType === 'MATERIEL' && enfantType !== 'MATERIEL') {
        throw new BadRequestException(
          'Un matériel ne peut avoir comme enfant qu’un autre matériel.',
        );
      }
    }

    if (dto.typeArborescence === 'MATERIEL') {
      if (parentType !== 'MATERIEL' || enfantType !== 'MATERIEL') {
        throw new BadRequestException(
          "Dans l'arborescence matériel, le parent et l'enfant doivent être des matériels.",
        );
      }
    }
  }

  private async assertNoCycle(dto: {
    typeArborescence: TypeArborescence;
    parentType: string;
    parentPointId?: number | null;
    parentMaterielId?: number | null;
    enfantType: string;
    enfantPointId?: number | null;
    enfantMaterielId?: number | null;
  }) {
    const liens = await this.prisma.lien_arborescence.findMany({
      where: {
        typeArborescence: dto.typeArborescence,
        actif: true,
      },
    });

    const graph = new Map<string, string[]>();

    for (const lien of liens) {
      const parentKey = this.makeNodeKey(
        lien.parentType as 'POINT_STRUCTURE' | 'MATERIEL',
        lien.parentPointId,
        lien.parentMaterielId,
      );

      const childKey = this.makeNodeKey(
        lien.enfantType as 'POINT_STRUCTURE' | 'MATERIEL',
        lien.enfantPointId,
        lien.enfantMaterielId,
      );

      if (!graph.has(parentKey)) {
        graph.set(parentKey, []);
      }

      graph.get(parentKey)!.push(childKey);
    }

    const newParentKey = this.makeNodeKey(
      dto.parentType as 'POINT_STRUCTURE' | 'MATERIEL',
      dto.parentPointId ?? null,
      dto.parentMaterielId ?? null,
    );

    const newChildKey = this.makeNodeKey(
      dto.enfantType as 'POINT_STRUCTURE' | 'MATERIEL',
      dto.enfantPointId ?? null,
      dto.enfantMaterielId ?? null,
    );

    if (!graph.has(newParentKey)) {
      graph.set(newParentKey, []);
    }

    graph.get(newParentKey)!.push(newChildKey);

    const visited = new Set<string>();
    const stack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (stack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      stack.add(node);

      for (const next of graph.get(node) ?? []) {
        if (hasCycle(next)) return true;
      }

      stack.delete(node);

      return false;
    };

    for (const node of graph.keys()) {
      if (hasCycle(node)) {
        throw new BadRequestException(
          "Cette liaison créerait une boucle dans l'arborescence.",
        );
      }
    }
  }

  /* =====================================================
     SYNCHRONISATION MATÉRIEL
  ===================================================== */

  private async synchroniserLienAvecMateriel(
    typeArborescence: TypeArborescence,
    dto: {
      parentType: string;
      parentPointId?: number | null;
      parentMaterielId?: number | null;
      enfantType: string;
      enfantMaterielId?: number | null;
    },
  ) {
    if (dto.enfantType !== 'MATERIEL' || !dto.enfantMaterielId) {
      return;
    }

    if (
      typeArborescence === 'GEOGRAPHIQUE' &&
      dto.parentType === 'POINT_STRUCTURE' &&
      dto.parentPointId
    ) {
      await this.prisma.materiel.update({
        where: { idMateriel: dto.enfantMaterielId },
        data: {
          idPointStructure: dto.parentPointId,
        },
      });
    }

    if (
      (typeArborescence === 'MATERIEL' ||
        typeArborescence === 'TECHNIQUE') &&
      dto.parentType === 'MATERIEL' &&
      dto.parentMaterielId
    ) {
      await this.prisma.materiel.update({
        where: { idMateriel: dto.enfantMaterielId },
        data: {
          idMaterielParent: dto.parentMaterielId,
        },
      });
    }
  }

  /* =====================================================
     HELPERS
  ===================================================== */

  private async getNode(
    nodeType: 'POINT_STRUCTURE' | 'MATERIEL',
    pointId?: number | null,
    materielId?: number | null,
  ) {
    if (nodeType === 'POINT_STRUCTURE') {
      if (!pointId) return null;

      return this.prisma.point_structure.findUnique({
        where: { idPoint: pointId },
      });
    }

    if (!materielId) return null;

    return this.prisma.materiel.findUnique({
      where: { idMateriel: materielId },
    });
  }

  private makeNodeKey(
    nodeType: 'POINT_STRUCTURE' | 'MATERIEL',
    pointId?: number | null,
    materielId?: number | null,
  ) {
    return nodeType === 'POINT_STRUCTURE'
      ? `POINT_STRUCTURE-${pointId}`
      : `MATERIEL-${materielId}`;
  }

  private createRootNode(children: TreeNode[]): TreeNode {
    return {
      key: 'ROOT-BMT',
      id: 0,
      type: 'ROOT',
      code: 'BMT',
      libelle: 'BMT',
      typePoint: 'ROOT',
      children,
    };
  }

  private toPointNode(point: any, children: TreeNode[]): TreeNode {
    return {
      key: `POINT_STRUCTURE-${point.idPoint}`,
      id: point.idPoint,
      type: 'POINT_STRUCTURE',
      code: point.code,
      libelle: point.libelle,
      typePoint: point.typePoint,
      children,
    };
  }

  private toMaterielNode(materiel: any, children: TreeNode[]): TreeNode {
    return {
      key: `MATERIEL-${materiel.idMateriel}`,
      id: materiel.idMateriel,
      type: 'MATERIEL',
      code: materiel.code,
      libelle: materiel.libelle ?? materiel.numeroSerie ?? materiel.code,
      children,
    };
  }

  private assertTypeArborescence(value: string): TypeArborescence {
    if (
      value !== 'GEOGRAPHIQUE' &&
      value !== 'TECHNIQUE' &&
      value !== 'MATERIEL'
    ) {
      throw new BadRequestException("Type d'arborescence invalide.");
    }

    return value;
  }
}