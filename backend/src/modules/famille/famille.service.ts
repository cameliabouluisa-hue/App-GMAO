import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateFamilleDto } from './dto/create-famille.dto';
import { UpdateFamilleDto } from './dto/update-famille.dto';

@Injectable()
export class FamilleService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly articleSelect = {
    idArticle: true,
    reference: true,
    designation: true,
    estModele: true,
    gereEnStock: true,
    serialise: true,
    reparable: true,
    actif: true,
    modeleEquipement: {
      select: {
        idModele: true,
        code: true,
        libelle: true,
      },
    },
  };

  async findAll() {
    return this.prisma.famille.findMany({
      include: {
        famille: true,

        other_famille: {
          where: {
            actif: true,
          },
          include: {
            articles: {
              select: this.articleSelect,
            },
          },
        },

        articles: {
          select: this.articleSelect,
        },
      },
      orderBy: {
        libelle: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const famille = await this.prisma.famille.findUnique({
      where: {
        idFamille: id,
      },
      include: {
        famille: true,

        other_famille: {
          where: {
            actif: true,
          },
          include: {
            articles: {
              select: this.articleSelect,
            },
          },
        },

        articles: {
          select: this.articleSelect,
        },
      },
    });

    if (!famille) {
      throw new NotFoundException('Famille introuvable.');
    }

    return famille;
  }

  async create(createDto: CreateFamilleDto) {
    if (createDto.parent_id !== undefined && createDto.parent_id !== null) {
      await this.ensureParentExists(createDto.parent_id);
    }

    return this.prisma.famille.create({
      data: {
        code: createDto.code?.trim(),
        libelle: createDto.libelle?.trim(),
        parent_id: createDto.parent_id,
        actif: createDto.actif ?? true,
        natureAchat: createDto.natureAchat,
        typeFamille: createDto.typeFamille,
      },
    });
  }

  async update(id: number, updateDto: UpdateFamilleDto) {
    await this.findOne(id);

    if (updateDto.parent_id !== undefined && updateDto.parent_id !== null) {
      if (updateDto.parent_id === id) {
        throw new BadRequestException(
          'Une famille ne peut pas être son propre parent.',
        );
      }

      await this.ensureParentExists(updateDto.parent_id);
    }

    return this.prisma.famille.update({
      where: {
        idFamille: id,
      },
      data: {
        ...(updateDto.code !== undefined && {
          code: updateDto.code?.trim(),
        }),
        ...(updateDto.libelle !== undefined && {
          libelle: updateDto.libelle?.trim(),
        }),
        ...(updateDto.parent_id !== undefined && {
          parent_id: updateDto.parent_id,
        }),
        ...(updateDto.actif !== undefined && {
          actif: updateDto.actif,
        }),
        ...(updateDto.natureAchat !== undefined && {
          natureAchat: updateDto.natureAchat,
        }),
        ...(updateDto.typeFamille !== undefined && {
          typeFamille: updateDto.typeFamille,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const childrenCount = await this.prisma.famille.count({
      where: {
        parent_id: id,
      },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette famille car elle possède des sous-familles.',
      );
    }

    const articleCount = await this.prisma.article.count({
      where: {
        idFamille: id,
      },
    });

    if (articleCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette famille car elle est utilisée par des articles.',
      );
    }

    const modeleCount = await this.prisma.modele.count({
      where: {
        idFamille: id,
      },
    });

    if (modeleCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette famille car elle est utilisée par des modèles.',
      );
    }

    return this.prisma.famille.delete({
      where: {
        idFamille: id,
      },
    });
  }

  private async ensureParentExists(parentId: number) {
    const parent = await this.prisma.famille.findUnique({
      where: {
        idFamille: parentId,
      },
    });

    if (!parent) {
      throw new BadRequestException('Famille parente introuvable.');
    }
  }
}