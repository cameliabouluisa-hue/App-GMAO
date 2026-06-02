import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateFamilleDto } from './dto/create-famille.dto';
import { UpdateFamilleDto } from './dto/update-famille.dto';

@Injectable()
export class FamilleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.famille.findMany({
      include: {
        modele: true,

        articles: {
          where: {
            actif: true,
          },
          select: {
            idArticle: true,
            reference: true,
            designation: true,
            idFamille: true,
            idModele: true,
            gereEnStock: true,
            serialise: true,
            reparable: true,
            actif: true,

            uniteArticle: true,
            modele: true,
          },
          orderBy: {
            idArticle: 'asc',
          },
        },

        other_famille: true,
        famille: true,

        _count: {
          select: {
            other_famille: true,
            modele: true,
            articles: true,
          },
        },
      },
      orderBy: {
        idFamille: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const famille = await this.prisma.famille.findUnique({
      where: { idFamille: id },
      include: {
        modele: true,

        articles: {
          where: {
            actif: true,
          },
          select: {
            idArticle: true,
            reference: true,
            designation: true,
            idFamille: true,
            idModele: true,
            gereEnStock: true,
            serialise: true,
            reparable: true,
            actif: true,

            uniteArticle: true,
            modele: true,
          },
          orderBy: {
            idArticle: 'asc',
          },
        },

        other_famille: true,
        famille: true,

        _count: {
          select: {
            other_famille: true,
            modele: true,
            articles: true,
          },
        },
      },
    });

    if (!famille) {
      throw new NotFoundException('Famille introuvable');
    }

    return famille;
  }

  create(data: CreateFamilleDto) {
    return this.prisma.famille.create({
      data: {
        code: data.code?.trim() || null,
        libelle: data.libelle?.trim() || null,
        parent_id: data.parent_id ?? null,
        actif: data.actif ?? true,
        typeFamille: data.typeFamille ?? 'EQUIPEMENT',
        natureAchat: data.natureAchat || null,
      },
    });
  }

  async update(id: number, data: UpdateFamilleDto) {
    await this.findOne(id);

    return this.prisma.famille.update({
      where: { idFamille: id },
      data: {
        code: data.code !== undefined ? data.code.trim() || null : undefined,
        libelle:
          data.libelle !== undefined ? data.libelle.trim() || null : undefined,
        parent_id: data.parent_id !== undefined ? data.parent_id : undefined,
        actif: data.actif !== undefined ? data.actif : undefined,
        typeFamille:
          data.typeFamille !== undefined ? data.typeFamille : undefined,
        natureAchat:
          data.natureAchat !== undefined ? data.natureAchat || null : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.famille.delete({
      where: { idFamille: id },
    });
  }
}