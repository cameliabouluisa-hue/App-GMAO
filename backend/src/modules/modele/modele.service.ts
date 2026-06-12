import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateModeleDto } from './dto/create-modele.dto';
import { UpdateModeleDto } from './dto/update-modele.dto';

@Injectable()
export class ModeleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.modele.findMany({
      include: {
        famille: true,
        etat_modele: true,
        type_equipement: true,
        fabricant: true,
        marque: true,
        modele_plan_preventif_predefini: {
          include: {
            plan_preventif_predefini: true,
          },
          orderBy: [
            { principal: 'desc' },
            { idModelePlanPreventifPredefini: 'asc' },
          ],
        },
      },
      orderBy: {
        idModele: 'desc',
      },
    });
  }

 async findOne(idModele: number) {
  const modele = await this.prisma.modele.findUnique({
    where: { idModele },
    include: {
      famille: true,
      etat_modele: true,
      type_equipement: true,
      fabricant: true,
      marque: true,
      gamme: true,
      materiel: true,
      article: true,

      plan_preventif_predefini: {
        include: {
          ppp_declencheur: {
            include: {
              gamme: true,
              point_mesure: true,
            },
            orderBy: {
              priorite: 'asc',
            },
          },
        },
        orderBy: {
          idPlanPreventifPredefini: 'desc',
        },
      },

      modele_plan_preventif_predefini: {
        include: {
          plan_preventif_predefini: {
            include: {
              ppp_declencheur: {
                include: {
                  gamme: true,
                  point_mesure: true,
                },
                orderBy: {
                  priorite: 'asc',
                },
              },
            },
          },
        },
        orderBy: [
          { principal: 'desc' },
          { idModelePlanPreventifPredefini: 'asc' },
        ],
      },
    },
  });

  if (!modele) {
    throw new NotFoundException('Modèle introuvable.');
  }

  return modele;
}

  async create(createModeleDto: CreateModeleDto) {
    const code = this.cleanText(createModeleDto.code);
    const libelle = this.cleanText(createModeleDto.libelle);
    const commentaire = this.cleanText(createModeleDto.commentaire);

    if (code) {
      const existingCode = await this.prisma.modele.findFirst({
        where: { code },
      });

      if (existingCode) {
        throw new BadRequestException('Ce code modèle existe déjà.');
      }
    }

    await this.validateFamille(createModeleDto.idFamille);
    await this.validateEtat(createModeleDto.idEtat);
    await this.validateTypeEquipement(createModeleDto.idTypeEquipement);
    await this.validateFabricant(createModeleDto.idFabricant);
    await this.validateMarque(createModeleDto.idMarque);

    const pppIds = this.normalizePppIds(createModeleDto.pppIds);
    const pppPrincipalId = this.resolvePrincipalPppId(
      pppIds,
      createModeleDto.pppPrincipalId,
    );

    await this.validatePppIds(pppIds);

    return this.prisma.$transaction(async (tx) => {
      const createdModele = await tx.modele.create({
        data: {
          code,
          libelle,
          idFamille: createModeleDto.idFamille ?? null,
          idEtat: createModeleDto.idEtat,

          idTypeEquipement: createModeleDto.idTypeEquipement ?? null,
          idFabricant: createModeleDto.idFabricant ?? null,
          idMarque: createModeleDto.idMarque ?? null,

          commentaire,
          dureeVie: createModeleDto.dureeVie ?? null,
          budget: createModeleDto.budget ?? null,
        },
      });

      if (pppIds.length > 0) {
        await tx.modele_plan_preventif_predefini.createMany({
          data: pppIds.map((idPlanPreventifPredefini) => ({
            idModele: createdModele.idModele,
            idPlanPreventifPredefini,
            principal: idPlanPreventifPredefini === pppPrincipalId,
            actif: true,
          })),
        });
      }

      return tx.modele.findUnique({
        where: { idModele: createdModele.idModele },
        include: {
          famille: true,
          etat_modele: true,
          type_equipement: true,
          fabricant: true,
          marque: true,
          modele_plan_preventif_predefini: {
            include: {
              plan_preventif_predefini: true,
            },
            orderBy: [
              { principal: 'desc' },
              { idModelePlanPreventifPredefini: 'asc' },
            ],
          },
        },
      });
    });
  }

  async update(idModele: number, updateModeleDto: UpdateModeleDto) {
    const existingModele = await this.prisma.modele.findUnique({
      where: { idModele },
    });

    if (!existingModele) {
      throw new NotFoundException('Modèle introuvable.');
    }

    const code =
      updateModeleDto.code !== undefined
        ? this.cleanText(updateModeleDto.code)
        : undefined;

    const libelle =
      updateModeleDto.libelle !== undefined
        ? this.cleanText(updateModeleDto.libelle)
        : undefined;

    const commentaire =
      updateModeleDto.commentaire !== undefined
        ? this.cleanText(updateModeleDto.commentaire)
        : undefined;

    if (code && code !== existingModele.code) {
      const existingCode = await this.prisma.modele.findFirst({
        where: {
          code,
          idModele: {
            not: idModele,
          },
        },
      });

      if (existingCode) {
        throw new BadRequestException('Ce code modèle existe déjà.');
      }
    }

    if (updateModeleDto.idFamille !== undefined) {
      await this.validateFamille(updateModeleDto.idFamille);
    }

    if (updateModeleDto.idEtat !== undefined) {
      await this.validateEtat(updateModeleDto.idEtat);
    }

    if (updateModeleDto.idTypeEquipement !== undefined) {
      await this.validateTypeEquipement(updateModeleDto.idTypeEquipement);
    }

    if (updateModeleDto.idFabricant !== undefined) {
      await this.validateFabricant(updateModeleDto.idFabricant);
    }

    if (updateModeleDto.idMarque !== undefined) {
      await this.validateMarque(updateModeleDto.idMarque);
    }

    const shouldUpdatePpp = updateModeleDto.pppIds !== undefined;

    const pppIds = shouldUpdatePpp
      ? this.normalizePppIds(updateModeleDto.pppIds)
      : [];

    const pppPrincipalId = shouldUpdatePpp
      ? this.resolvePrincipalPppId(pppIds, updateModeleDto.pppPrincipalId)
      : null;

    if (shouldUpdatePpp) {
      await this.validatePppIds(pppIds);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.modele.update({
        where: { idModele },
        data: {
          code,
          libelle,

          idFamille: updateModeleDto.idFamille,
          idEtat: updateModeleDto.idEtat,

          idTypeEquipement: updateModeleDto.idTypeEquipement,
          idFabricant: updateModeleDto.idFabricant,
          idMarque: updateModeleDto.idMarque,

          commentaire,
          dureeVie: updateModeleDto.dureeVie,
          budget: updateModeleDto.budget,
        },
      });

      if (shouldUpdatePpp) {
        await tx.modele_plan_preventif_predefini.deleteMany({
          where: { idModele },
        });

        if (pppIds.length > 0) {
          await tx.modele_plan_preventif_predefini.createMany({
            data: pppIds.map((idPlanPreventifPredefini) => ({
              idModele,
              idPlanPreventifPredefini,
              principal: idPlanPreventifPredefini === pppPrincipalId,
              actif: true,
            })),
          });
        }
      }

      return tx.modele.findUnique({
        where: { idModele },
        include: {
          famille: true,
          etat_modele: true,
          type_equipement: true,
          fabricant: true,
          marque: true,
          modele_plan_preventif_predefini: {
            include: {
              plan_preventif_predefini: true,
            },
            orderBy: [
              { principal: 'desc' },
              { idModelePlanPreventifPredefini: 'asc' },
            ],
          },
        },
      });
    });
  }

  async remove(idModele: number) {
    const existingModele = await this.prisma.modele.findUnique({
      where: { idModele },
      include: {
        _count: {
  select: {
    gamme: true,
    gamme_operation: true,
    materiel: true,
    plan_preventif_declencheur: true,
    ppp_declencheur: true,
  },
},
article: true,
      },
    });

    if (!existingModele) {
      throw new NotFoundException('Modèle introuvable.');
    }

    const isUsed = false;

    if (false && isUsed) {
      throw new BadRequestException(
        'Impossible de supprimer ce modèle car il est déjà utilisé dans le système.',
      );
    }

    return this.prisma.modele.update({
      where: { idModele },
      data: { actif: false },
    });
  }

  async restore(idModele: number) {
    await this.findOne(idModele);

    return this.prisma.modele.update({
      where: { idModele },
      data: { actif: true },
    });
  }

  private cleanText(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const cleaned = value.trim();

    return cleaned.length > 0 ? cleaned : null;
  }

  private normalizePppIds(pppIds?: number[] | null) {
    if (!pppIds || pppIds.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        pppIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
  }

  private resolvePrincipalPppId(
    pppIds: number[],
    pppPrincipalId?: number | null,
  ) {
    if (pppIds.length === 0) {
      if (pppPrincipalId) {
        throw new BadRequestException(
          'Impossible de définir un PPP principal sans sélectionner de PPP.',
        );
      }

      return null;
    }

    if (pppPrincipalId !== undefined && pppPrincipalId !== null) {
      if (!pppIds.includes(Number(pppPrincipalId))) {
        throw new BadRequestException(
          'Le PPP principal doit faire partie des PPP sélectionnés.',
        );
      }

      return Number(pppPrincipalId);
    }

    return pppIds[0];
  }

  private async validatePppIds(pppIds: number[]) {
    if (pppIds.length === 0) {
      return;
    }

    const existingPpp = await this.prisma.plan_preventif_predefini.findMany({
      where: {
        idPlanPreventifPredefini: {
          in: pppIds,
        },
      },
      select: {
        idPlanPreventifPredefini: true,
      },
    });

    if (existingPpp.length !== pppIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs plans préventifs prédéfinis sont introuvables.',
      );
    }
  }

  private async validateFamille(idFamille?: number | null) {
    if (idFamille === undefined || idFamille === null) {
      return;
    }

    const famille = await this.prisma.famille.findUnique({
      where: { idFamille },
    });

    if (!famille) {
      throw new BadRequestException('La famille sélectionnée est introuvable.');
    }
  }

  private async validateEtat(idEtat?: number | null) {
    if (idEtat === undefined || idEtat === null) {
      throw new BadRequestException("L'état du modèle est obligatoire.");
    }

    const etat = await this.prisma.etat_modele.findUnique({
      where: { idEtat },
    });

    if (!etat) {
      throw new BadRequestException("L'état du modèle est introuvable.");
    }
  }

  private async validateTypeEquipement(idTypeEquipement?: number | null) {
    if (idTypeEquipement === undefined || idTypeEquipement === null) {
      return;
    }

    const typeEquipement = await this.prisma.type_equipement.findUnique({
      where: { idTypeEquipement },
    });

    if (!typeEquipement) {
      throw new BadRequestException(
        "Le type d'équipement sélectionné est introuvable.",
      );
    }
  }

  private async validateFabricant(idFabricant?: number | null) {
    if (idFabricant === undefined || idFabricant === null) {
      return;
    }

    const fabricant = await this.prisma.fabricant.findUnique({
      where: { idFabricant },
    });

    if (!fabricant) {
      throw new BadRequestException('Le fabricant sélectionné est introuvable.');
    }
  }

  private async validateMarque(idMarque?: number | null) {
    if (idMarque === undefined || idMarque === null) {
      return;
    }

    const marque = await this.prisma.marque.findUnique({
      where: { idMarque },
    });

    if (!marque) {
      throw new BadRequestException('La marque sélectionnée est introuvable.');
    }
  }
}
