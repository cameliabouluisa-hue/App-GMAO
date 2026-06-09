import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePointStructureDto } from './dto/create-points-structure.dto';
import { UpdatePointStructureDto } from './dto/update-points-structure.dto';
import { FindPointStructureQueryDto } from './dto/find-points-structure-query.dto';

type TypeArborescenceValue = 'GEOGRAPHIQUE' | 'TECHNIQUE';

const TYPE_NOEUD_POINT_STRUCTURE = 'POINT_STRUCTURE';
const ETAT_VALIDE = 'VALIDE';
const ETAT_ARCHIVE = 'ARCHIVE';
const CRITICITE_MOYENNE = 'MOYENNE';

@Injectable()
export class PointsStructureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindPointStructureQueryDto = {}) {
    const where: any = {};

    
if (query.typePoint) {
  where.typePoint = query.typePoint;
}

if (query.actif === 'true') {
  where.actif = true;
}

if (query.actif === 'false') {
  where.actif = false;
}

    

    if (query.etat) {
      where.etat = query.etat;
    }

    if (query.categorie) {
      where.categorie = query.categorie;
    }

    if (query.criticite) {
      where.criticite = query.criticite;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { libelle: { contains: query.search } },
        { description: { contains: query.search } },
        { categorie: { contains: query.search } },
        { responsable: { contains: query.search } },
        { organisation: { contains: query.search } },
        { centreCout: { contains: query.search } },
      ];
    }

    const points = await this.prisma.point_structure.findMany({
      where,
      orderBy: [
        { typePoint: 'asc' },
        { libelle: 'asc' },
        { idPoint: 'asc' },
      ],
      include: {
        _count: {
          select: {
            materiels: true,
          },
        },
      },
    });

    return this.enrichPoints(points);
  }

  async findOne(idPoint: number) {
    const point = await this.prisma.point_structure.findUnique({
      where: { idPoint },
      include: {
        _count: {
          select: {
            materiels: true,
          },
        },
      },
    });

    if (!point) {
      throw new NotFoundException('Point de structure introuvable.');
    }

    const [enrichedPoint] = await this.enrichPoints([point]);
    return enrichedPoint;
  }

  async getStats() {
    const [total, geographiques, techniques, actifs, inactifs] =
      await Promise.all([
        this.prisma.point_structure.count(),
        this.prisma.point_structure.count({
          where: { typePoint: 'GEOGRAPHIQUE' },
        }),
        this.prisma.point_structure.count({
          where: { typePoint: 'TECHNIQUE' },
        }),
        this.prisma.point_structure.count({
          where: { actif: true },
        }),
        this.prisma.point_structure.count({
          where: { actif: false },
        }),
      ]);

    return {
      total,
      geographiques,
      techniques,
      actifs,
      inactifs,
    };
  }

  async findParents(typePoint?: string, excludeId?: number) {
    const where: any = {
      actif: true,
    };

    if (typePoint) {
      where.typePoint = typePoint;
    }

    if (excludeId) {
      where.NOT = {
        idPoint: excludeId,
      };
    }

    return this.prisma.point_structure.findMany({
      where,
      select: {
        idPoint: true,
        code: true,
        libelle: true,
        typePoint: true,
        actif: true,
      },
      orderBy: [
        { typePoint: 'asc' },
        { libelle: 'asc' },
      ],
    });
  }

  async create(dto: CreatePointStructureDto) {
    const code = this.normalizeCode(dto.code);

    await this.assertCodeDisponible(code);

    const typeArborescence = this.resolveTypeArborescence(
      dto.typeArborescence,
      dto.typePoint,
    );

    const createdPoint = await this.prisma.$transaction(async (tx) => {
      if (dto.parentPointId) {
        await this.validateParentPoint({
          tx,
          parentPointId: dto.parentPointId,
          typeArborescence,
          enfantTypePoint: dto.typePoint,
        });
      }

      const point = await tx.point_structure.create({
        data: {
          code,
          libelle: this.normalizeText(dto.libelle),
          description: this.nullableText(dto.description),
          typePoint: dto.typePoint,
          actif: dto.actif ?? true,

          etat: dto.etat ?? ETAT_VALIDE,
          categorie: this.nullableText(dto.categorie),

          responsable: this.nullableText(dto.responsable),
          organisation: this.nullableText(dto.organisation),
          centreCout: this.nullableText(dto.centreCout),

          interventionsAutorisees: dto.interventionsAutorisees ?? true,
          criticite: dto.criticite ?? CRITICITE_MOYENNE,
          observationMaintenance: this.nullableText(
            dto.observationMaintenance,
          ),

          zoneSensible: dto.zoneSensible ?? false,
          accesRestreint: dto.accesRestreint ?? false,
          epiObligatoire: dto.epiObligatoire ?? false,
          consigneSecurite: this.nullableText(dto.consigneSecurite),
        },
      });

      if (dto.parentPointId) {
        await tx.lien_arborescence.create({
          data: {
            typeArborescence,

            parentType: TYPE_NOEUD_POINT_STRUCTURE,
            parentPointId: dto.parentPointId,
            parentMaterielId: null,

            enfantType: TYPE_NOEUD_POINT_STRUCTURE,
            enfantPointId: point.idPoint,
            enfantMaterielId: null,

            ordre: dto.ordre ?? null,
            actif: true,
          },
        });
      }

      return point;
    });

    return this.findOne(createdPoint.idPoint);
  }

  async update(idPoint: number, dto: UpdatePointStructureDto) {
    const existingPoint = await this.prisma.point_structure.findUnique({
      where: { idPoint },
    });

    if (!existingPoint) {
      throw new NotFoundException('Point de structure introuvable.');
    }

    if (dto.code !== undefined) {
      const nextCode = this.normalizeCode(dto.code);

      if (nextCode !== existingPoint.code) {
        await this.assertCodeDisponible(nextCode, idPoint);
      }
    }

    const currentLien = await this.prisma.lien_arborescence.findFirst({
      where: {
        enfantType: TYPE_NOEUD_POINT_STRUCTURE,
        enfantPointId: idPoint,
        actif: true,
      },
      orderBy: {
        idLien: 'desc',
      },
    });

    const nextTypePoint = dto.typePoint ?? existingPoint.typePoint;

    const nextTypeArborescence = this.resolveTypeArborescence(
      dto.typeArborescence ?? currentLien?.typeArborescence,
      nextTypePoint,
    );

    const updatedPoint = await this.prisma.$transaction(async (tx) => {
      const data: any = {};

      if (dto.code !== undefined) {
        data.code = this.normalizeCode(dto.code);
      }

      if (dto.libelle !== undefined) {
        data.libelle = this.normalizeText(dto.libelle);
      }

      if (dto.description !== undefined) {
        data.description = this.nullableText(dto.description);
      }

      if (dto.typePoint !== undefined) {
        data.typePoint = dto.typePoint;
      }

      if (dto.actif !== undefined) {
        data.actif = dto.actif;
      }

      if (dto.etat !== undefined) {
        data.etat = dto.etat;
      }

      if (dto.categorie !== undefined) {
        data.categorie = this.nullableText(dto.categorie);
      }

      if (dto.responsable !== undefined) {
        data.responsable = this.nullableText(dto.responsable);
      }

      if (dto.organisation !== undefined) {
        data.organisation = this.nullableText(dto.organisation);
      }

      if (dto.centreCout !== undefined) {
        data.centreCout = this.nullableText(dto.centreCout);
      }

      if (dto.interventionsAutorisees !== undefined) {
        data.interventionsAutorisees = dto.interventionsAutorisees;
      }

      if (dto.criticite !== undefined) {
        data.criticite = dto.criticite;
      }

      if (dto.observationMaintenance !== undefined) {
        data.observationMaintenance = this.nullableText(
          dto.observationMaintenance,
        );
      }

      if (dto.zoneSensible !== undefined) {
        data.zoneSensible = dto.zoneSensible;
      }

      if (dto.accesRestreint !== undefined) {
        data.accesRestreint = dto.accesRestreint;
      }

      if (dto.epiObligatoire !== undefined) {
        data.epiObligatoire = dto.epiObligatoire;
      }

      if (dto.consigneSecurite !== undefined) {
        data.consigneSecurite = this.nullableText(dto.consigneSecurite);
      }

      const point = await tx.point_structure.update({
        where: { idPoint },
        data,
      });

      const arborescenceTouched =
        this.hasOwn(dto, 'parentPointId') ||
        this.hasOwn(dto, 'typeArborescence') ||
        this.hasOwn(dto, 'ordre') ||
        this.hasOwn(dto, 'typePoint');

      if (arborescenceTouched) {
        const nextParentPointId = this.hasOwn(dto, 'parentPointId')
          ? dto.parentPointId
          : currentLien?.parentPointId ?? null;

        const nextOrdre = this.hasOwn(dto, 'ordre')
          ? dto.ordre
          : currentLien?.ordre ?? null;

        await tx.lien_arborescence.updateMany({
          where: {
            enfantType: TYPE_NOEUD_POINT_STRUCTURE,
            enfantPointId: idPoint,
            actif: true,
          },
          data: {
            actif: false,
          },
        });

        if (nextParentPointId !== null && nextParentPointId !== undefined) {
          await this.validateParentPoint({
            tx,
            parentPointId: nextParentPointId,
            typeArborescence: nextTypeArborescence,
            enfantTypePoint: nextTypePoint,
          });

          await this.assertNoCyclePoint({
            tx,
            pointId: idPoint,
            parentPointId: nextParentPointId,
            typeArborescence: nextTypeArborescence,
          });

          await tx.lien_arborescence.create({
            data: {
              typeArborescence: nextTypeArborescence,

              parentType: TYPE_NOEUD_POINT_STRUCTURE,
              parentPointId: nextParentPointId,
              parentMaterielId: null,

              enfantType: TYPE_NOEUD_POINT_STRUCTURE,
              enfantPointId: idPoint,
              enfantMaterielId: null,

              ordre: nextOrdre ?? null,
              actif: true,
            },
          });
        }
      }

      return point;
    });

    return this.findOne(updatedPoint.idPoint);
  }

  async remove(idPoint: number) {
    const point = await this.prisma.point_structure.findUnique({
      where: { idPoint },
    });

    if (!point) {
      throw new NotFoundException('Point de structure introuvable.');
    }

    const activeChildren = await this.prisma.lien_arborescence.count({
      where: {
        parentType: TYPE_NOEUD_POINT_STRUCTURE,
        parentPointId: idPoint,
        actif: true,
      },
    });

    if (activeChildren > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce point : il contient encore des sous-points.',
      );
    }

    const activeMateriels = await this.prisma.materiel.count({
      where: {
        idPointStructure: idPoint,
        actif: true,
      },
    });

    if (activeMateriels > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce point : des matériels actifs sont encore rattachés à ce point.',
      );
    }

    const archivedPoint = await this.prisma.$transaction(async (tx) => {
      await tx.lien_arborescence.updateMany({
        where: {
          enfantType: TYPE_NOEUD_POINT_STRUCTURE,
          enfantPointId: idPoint,
          actif: true,
        },
        data: {
          actif: false,
        },
      });

      return tx.point_structure.update({
        where: { idPoint },
        data: {
          actif: false,
          etat: ETAT_ARCHIVE,
        },
      });
    });

    return {
      message: 'Point de structure archivé avec succès.',
      point: archivedPoint,
    };
  }

  async restore(idPoint: number) {
    const point = await this.prisma.point_structure.findUnique({
      where: { idPoint },
    });

    if (!point) {
      throw new NotFoundException('Point de structure introuvable.');
    }

    const restoredPoint = await this.prisma.point_structure.update({
      where: { idPoint },
      data: {
        actif: true,
        etat: ETAT_VALIDE,
      },
    });

    return {
      message: 'Point de structure restauré avec succès.',
      point: restoredPoint,
    };
  }
async deleteDefinitif(idPoint: number) {
  const point = await this.prisma.point_structure.findUnique({
    where: { idPoint },
  });

  if (!point) {
    throw new NotFoundException('Point de structure introuvable.');
  }

  const activeChildren = await this.prisma.lien_arborescence.count({
    where: {
      parentType: TYPE_NOEUD_POINT_STRUCTURE,
      parentPointId: idPoint,
      actif: true,
    },
  });

  if (activeChildren > 0) {
    throw new BadRequestException(
      'Suppression définitive impossible : ce point contient encore des sous-points.',
    );
  }

  const activeMateriels = await this.prisma.materiel.count({
    where: {
      idPointStructure: idPoint,
      actif: true,
    },
  });

  if (activeMateriels > 0) {
    throw new BadRequestException(
      'Suppression définitive impossible : des matériels actifs sont encore rattachés à ce point.',
    );
  }

  try {
    await this.prisma.$transaction(async (tx) => {
      await tx.lien_arborescence.deleteMany({
        where: {
          OR: [
            {
              parentType: TYPE_NOEUD_POINT_STRUCTURE,
              parentPointId: idPoint,
            },
            {
              enfantType: TYPE_NOEUD_POINT_STRUCTURE,
              enfantPointId: idPoint,
            },
          ],
        },
      });

      await tx.point_structure.delete({
        where: { idPoint },
      });
    });

    return {
      message: 'Point de structure supprimé définitivement avec succès.',
      idPoint,
    };
  } catch (error) {
    throw new BadRequestException(
      "Suppression définitive impossible : ce point est encore lié à d'autres éléments de la GMAO. Utilise plutôt l’archivage.",
    );
  }
}
  private async enrichPoints(points: any[]) {
    if (!points.length) return [];

    const pointIds = points.map((point) => point.idPoint);

    const liens = await this.prisma.lien_arborescence.findMany({
      where: {
        enfantType: TYPE_NOEUD_POINT_STRUCTURE,
        enfantPointId: {
          in: pointIds,
        },
        actif: true,
      },
      orderBy: [
        { typeArborescence: 'asc' },
        { ordre: 'asc' },
        { idLien: 'asc' },
      ],
    });

    const parentIds = liens
      .map((lien) => lien.parentPointId)
      .filter((id): id is number => typeof id === 'number');

    const parents = parentIds.length
      ? await this.prisma.point_structure.findMany({
          where: {
            idPoint: {
              in: parentIds,
            },
          },
          select: {
            idPoint: true,
            code: true,
            libelle: true,
            typePoint: true,
          },
        })
      : [];

    const parentById = new Map<number, any>();

    for (const parent of parents) {
      parentById.set(parent.idPoint, parent);
    }

    return points.map((point) => {
      const liensPoint = liens.filter(
        (lien) => lien.enfantPointId === point.idPoint,
      );

      const lienPrincipal = liensPoint[0] ?? null;

      const parent =
        lienPrincipal?.parentPointId !== null &&
        lienPrincipal?.parentPointId !== undefined
          ? parentById.get(lienPrincipal.parentPointId) ?? null
          : null;

      const { _count, ...cleanPoint } = point;

      return {
        ...cleanPoint,
        materielsCount: _count?.materiels ?? 0,
        liensArborescence: liensPoint,
        placement: lienPrincipal,
        parent,
      };
    });
  }

  private async assertCodeDisponible(code: string, excludeId?: number) {
    const existing = await this.prisma.point_structure.findFirst({
      where: {
        code,
        ...(excludeId
          ? {
              NOT: {
                idPoint: excludeId,
              },
            }
          : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        `Le code "${code}" est déjà utilisé par un autre point de structure.`,
      );
    }
  }

  private resolveTypeArborescence(
    typeArborescence: unknown,
    typePoint: unknown,
  ): TypeArborescenceValue {
    const value = String(typeArborescence ?? typePoint);

    if (value !== 'GEOGRAPHIQUE' && value !== 'TECHNIQUE') {
      throw new BadRequestException(
        "Le type d'arborescence doit être GEOGRAPHIQUE ou TECHNIQUE.",
      );
    }

    return value;
  }

  private async validateParentPoint(params: {
    tx: any;
    parentPointId: number;
    typeArborescence: TypeArborescenceValue;
    enfantTypePoint: unknown;
  }) {
    const { tx, parentPointId, typeArborescence, enfantTypePoint } = params;

    const parent = await tx.point_structure.findUnique({
      where: {
        idPoint: parentPointId,
      },
    });

    if (!parent) {
      throw new NotFoundException('Point parent introuvable.');
    }

    if (parent.actif === false) {
      throw new BadRequestException('Le point parent est archivé ou inactif.');
    }

    const enfantType = String(enfantTypePoint);

    if (typeArborescence === 'GEOGRAPHIQUE') {
      if (parent.typePoint !== 'GEOGRAPHIQUE') {
        throw new BadRequestException(
          "Dans l'arborescence géographique, le parent doit être géographique.",
        );
      }

      if (enfantType !== 'GEOGRAPHIQUE' && enfantType !== 'TECHNIQUE') {
        throw new BadRequestException(
          "Dans l'arborescence géographique, l'enfant doit être géographique ou technique.",
        );
      }
    }

    if (typeArborescence === 'TECHNIQUE') {
      if (parent.typePoint !== 'TECHNIQUE') {
        throw new BadRequestException(
          "Dans l'arborescence technique, le parent doit être technique.",
        );
      }

      if (enfantType !== 'TECHNIQUE') {
        throw new BadRequestException(
          "Dans l'arborescence technique, l'enfant doit être technique.",
        );
      }
    }
  }

  private async assertNoCyclePoint(params: {
    tx: any;
    pointId: number;
    parentPointId: number;
    typeArborescence: TypeArborescenceValue;
  }) {
    const { tx, pointId, parentPointId, typeArborescence } = params;

    if (pointId === parentPointId) {
      throw new BadRequestException(
        'Un point de structure ne peut pas être son propre parent.',
      );
    }

    let currentParentId: number | null = parentPointId;

    while (currentParentId) {
      if (currentParentId === pointId) {
        throw new BadRequestException(
          'Déplacement impossible : cela créerait une boucle dans l’arborescence.',
        );
      }

      const parentLink = await tx.lien_arborescence.findFirst({
        where: {
          typeArborescence,
          enfantType: TYPE_NOEUD_POINT_STRUCTURE,
          enfantPointId: currentParentId,
          actif: true,
        },
        orderBy: {
          idLien: 'desc',
        },
      });

      if (!parentLink || parentLink.parentType !== TYPE_NOEUD_POINT_STRUCTURE) {
        break;
      }

      currentParentId = parentLink.parentPointId ?? null;
    }
  }

  private normalizeCode(value: string) {
    return value.trim().toUpperCase();
  }

  private normalizeText(value: string) {
    return value.trim();
  }

  private nullableText(value?: string | null) {
    if (value === undefined || value === null) return null;

    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private hasOwn(object: object, key: string) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }
}