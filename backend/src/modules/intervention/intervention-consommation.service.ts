import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { AnnulerConsommationInterventionDto } from './dto/annuler-consommation-intervention.dto';
import { CreateConsommationInterventionDto } from './dto/create-consommation-intervention.dto';

@Injectable()
export class InterventionConsommationService {
  constructor(private readonly prisma: PrismaService) {}

  async getConsommations(idIntervention: number) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { idIntervention },
      select: {
        idIntervention: true,
        code: true,
        etat: true,
      },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    return this.prisma.consommation.findMany({
      where: { idIntervention },
      include: {
        article: true,
        magasin: true,
        sortieStockLigne: {
          include: {
            sortieStock: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createConsommation(
    idIntervention: number,
    dto: CreateConsommationInterventionDto,
  ) {
    const quantite = new Prisma.Decimal(dto.quantite);

    if (quantite.lte(0)) {
      throw new BadRequestException('La quantité doit être supérieure à 0.');
    }

    const intervention = await this.prisma.intervention.findUnique({
      where: { idIntervention },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    if (intervention.etat !== 'EN_COURS') {
      throw new BadRequestException(
        'La consommation est autorisée uniquement sur une intervention EN_COURS.',
      );
    }

    const article = await this.prisma.article.findUnique({
      where: { idArticle: dto.idArticle },
    });

    if (!article) {
      throw new NotFoundException('Article introuvable.');
    }

    if (!article.actif) {
      throw new BadRequestException('Article inactif.');
    }

    if (!article.gereEnStock) {
      throw new BadRequestException("Cet article n'est pas géré en stock.");
    }

    const magasin = await this.prisma.magasin.findUnique({
      where: { idMagasin: dto.idMagasin },
    });

    if (!magasin) {
      throw new NotFoundException('Magasin introuvable.');
    }

    if (!magasin.actif) {
      throw new BadRequestException('Magasin inactif.');
    }

    const prixUnitaire = new Prisma.Decimal(
      dto.prixUnitaire ??
        article.prixUnitaire ??
        article.prixMoyenPondere ??
        article.prixStandard ??
        0,
    );

    const coutTotal = prixUnitaire.mul(quantite);

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock_article_magasin.findUnique({
        where: {
          idArticle_idMagasin: {
            idArticle: dto.idArticle,
            idMagasin: dto.idMagasin,
          },
        },
      });

      if (!stock) {
        throw new BadRequestException(
          'Aucun stock trouvé pour cet article dans ce magasin.',
        );
      }

      if (stock.quantiteDisponible.lt(quantite)) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible : ${stock.quantiteDisponible.toString()}`,
        );
      }

      const sortieStock = await tx.sortie_stock.create({
        data: {
          numero: `SORT-INT-${idIntervention}-${Date.now()}`,
          dateSortie: new Date(),
          statut: 'VALIDEE',
          idIntervention,
          commentaire:
            dto.commentaire ??
            `Sortie automatique liée à l'intervention ${idIntervention}`,
        },
      });

      const ligneSortie = await tx.sortie_stock_ligne.create({
        data: {
          idSortieStock: sortieStock.idSortieStock,
          idArticle: dto.idArticle,
          idMagasin: dto.idMagasin,
          quantite,
          prixUnitaire,
          commentaire: dto.commentaire,
        },
      });

      await tx.stock_article_magasin.update({
        where: {
          idArticle_idMagasin: {
            idArticle: dto.idArticle,
            idMagasin: dto.idMagasin,
          },
        },
        data: {
          quantitePhysique: {
            decrement: quantite,
          },
          quantiteDisponible: {
            decrement: quantite,
          },
        },
      });

      await tx.mouvement_stock.create({
        data: {
          typeMouvement: 'SORTIE_INTERVENTION',
          dateMouvement: new Date(),
          quantite,
          idArticle: dto.idArticle,
          idMagasinSource: dto.idMagasin,
          origineType: 'INTERVENTION',
          origineId: idIntervention,
          commentaire:
            dto.commentaire ??
            `Consommation article sur intervention ${idIntervention}`,
        },
      });

      const consommation = await tx.consommation.create({
        data: {
          idArticle: dto.idArticle,
          idIntervention,
          idMagasin: dto.idMagasin,
          idSortieStockLigne: ligneSortie.idLigneSortieStock,
          quantite,
          prixUnitaire,
          coutTotal,
          statut: 'ACTIVE',
          commentaire: dto.commentaire,
          createdBy: dto.createdBy,
        },
        include: {
          article: true,
          magasin: true,
          sortieStockLigne: {
            include: {
              sortieStock: true,
            },
          },
        },
      });

      await this.recalculerCoutsConsommationsTx(tx, idIntervention);

      return consommation;
    });
  }

  async annulerConsommation(
    idIntervention: number,
    idConsommation: number,
    dto: AnnulerConsommationInterventionDto,
  ) {
    const consommation = await this.prisma.consommation.findUnique({
      where: { idConsommation },
      include: {
        article: true,
        magasin: true,
        sortieStockLigne: true,
      },
    });

    if (!consommation) {
      throw new NotFoundException('Consommation introuvable.');
    }

    if (consommation.idIntervention !== idIntervention) {
      throw new BadRequestException(
        "Cette consommation n'appartient pas à cette intervention.",
      );
    }

    if (consommation.statut === 'ANNULEE') {
      throw new BadRequestException('Cette consommation est déjà annulée.');
    }

    if (!consommation.idMagasin) {
      throw new BadRequestException(
        "Impossible d'annuler cette consommation : aucun magasin lié.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.stock_article_magasin.update({
        where: {
          idArticle_idMagasin: {
            idArticle: consommation.idArticle,
            idMagasin: consommation.idMagasin!,
          },
        },
        data: {
          quantitePhysique: {
            increment: consommation.quantite,
          },
          quantiteDisponible: {
            increment: consommation.quantite,
          },
        },
      });

      await tx.mouvement_stock.create({
        data: {
          typeMouvement: 'ANNULATION_SORTIE_INTERVENTION',
          dateMouvement: new Date(),
          quantite: consommation.quantite,
          idArticle: consommation.idArticle,
          idMagasinDestination: consommation.idMagasin!,
          origineType: 'INTERVENTION',
          origineId: idIntervention,
          commentaire: dto.motifAnnulation,
        },
      });

      const updated = await tx.consommation.update({
        where: { idConsommation },
        data: {
          statut: 'ANNULEE',
          quantiteRetournee: consommation.quantite,
          cancelledBy: dto.cancelledBy,
          cancelledAt: new Date(),
          motifAnnulation: dto.motifAnnulation,
        },
        include: {
          article: true,
          magasin: true,
          sortieStockLigne: {
            include: {
              sortieStock: true,
            },
          },
        },
      });

      await this.recalculerCoutsConsommationsTx(tx, idIntervention);

      return updated;
    });
  }

  private async recalculerCoutsConsommationsTx(
    tx: Prisma.TransactionClient,
    idIntervention: number,
  ) {
    const consommations = await tx.consommation.findMany({
      where: {
        idIntervention,
        statut: 'ACTIVE',
      },
      select: {
        coutTotal: true,
      },
    });

    const coutPiecesReel = consommations.reduce(
      (total, item) => total.plus(item.coutTotal ?? 0),
      new Prisma.Decimal(0),
    );

    const intervention = await tx.intervention.findUnique({
      where: { idIntervention },
      select: {
        coutMainOeuvreReel: true,
        coutMoyensReel: true,
        coutSousTraitanceReel: true,
      },
    });

    const coutTotalReel = coutPiecesReel
      .plus(intervention?.coutMainOeuvreReel ?? 0)
      .plus(intervention?.coutMoyensReel ?? 0)
      .plus(intervention?.coutSousTraitanceReel ?? 0);

    await tx.intervention.update({
      where: { idIntervention },
      data: {
        coutPiecesReel,
        coutTotalReel,
      },
    });
  }
}