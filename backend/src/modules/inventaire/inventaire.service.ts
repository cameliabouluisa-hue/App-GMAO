import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ValiderInventaireDto } from './dto/valider-inventaire.dto';

@Injectable()
export class InventaireService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async findMagasins() {
    return this.prisma.magasin.findMany({
      where: {
        actif: true,
      },
      orderBy: {
        code: 'asc',
      },
      select: {
        idMagasin: true,
        code: true,
        libelle: true,
      },
    });
  }

  async findStock(idMagasin?: number, search?: string) {
    const where: any = {};

    if (idMagasin) {
      where.idMagasin = idMagasin;
    }
const stocks = await this.prisma.stock_article_magasin.findMany({
  include: {
    article: {
      include: {
        famille: true,
        uniteArticle: true,
        modeleEquipement: true,
      },
    },
    magasin: true,
  },
});

    const normalizedSearch = search?.trim().toLowerCase();

    const filteredStocks = normalizedSearch
      ? stocks.filter((stock) => {
          const reference = stock.article.reference?.toLowerCase() ?? '';
          const designation = stock.article.designation?.toLowerCase() ?? '';
          const magasinCode = stock.magasin.code?.toLowerCase() ?? '';
          const magasinLibelle = stock.magasin.libelle?.toLowerCase() ?? '';

          return (
            reference.includes(normalizedSearch) ||
            designation.includes(normalizedSearch) ||
            magasinCode.includes(normalizedSearch) ||
            magasinLibelle.includes(normalizedSearch)
          );
        })
      : stocks;

    return filteredStocks.map((stock) => ({
      idStock: stock.idStock,

      idArticle: stock.idArticle,
      reference: stock.article.reference,
      designation: stock.article.designation,
      unite: stock.article.uniteArticle?.code ?? null,
      serialise: stock.article.serialise,
      famille: stock.article.famille?.libelle ?? null,
    modele: stock.article.modeleEquipement?.code ?? null,

      idMagasin: stock.idMagasin,
      magasinCode: stock.magasin.code,
      magasinLibelle: stock.magasin.libelle,

      quantiteTheorique: this.toNumber(stock.quantitePhysique),
      quantiteReservee: this.toNumber(stock.quantiteReservee),
      quantiteDisponible: this.toNumber(stock.quantiteDisponible),
    }));
  }

  async validerInventaire(dto: ValiderInventaireDto) {
    if (!dto.lignes || dto.lignes.length === 0) {
      throw new BadRequestException(
        'Vous devez saisir au moins une ligne d’inventaire.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const magasin = await tx.magasin.findUnique({
        where: {
          idMagasin: dto.idMagasin,
        },
      });

      if (!magasin) {
        throw new NotFoundException('Magasin introuvable.');
      }

      const resultats: any[] = [];
      let mouvementsCrees = 0;
      let totalEcartsAbs = 0;

      for (const ligne of dto.lignes) {
        const quantiteReelle = this.round2(Number(ligne.quantiteReelle));

        if (Number.isNaN(quantiteReelle) || quantiteReelle < 0) {
          throw new BadRequestException(
            'La quantité réelle doit être un nombre positif.',
          );
        }

        const stock = await tx.stock_article_magasin.findUnique({
          where: {
            idArticle_idMagasin: {
              idArticle: ligne.idArticle,
              idMagasin: dto.idMagasin,
            },
          },
          include: {
            article: true,
          },
        });

        if (!stock) {
          throw new NotFoundException(
            `Stock introuvable pour l’article ${ligne.idArticle} dans ce magasin.`,
          );
        }

        const quantiteTheorique = this.toNumber(stock.quantitePhysique);
        const quantiteReservee = this.toNumber(stock.quantiteReservee);
        const ecart = this.round2(quantiteReelle - quantiteTheorique);

        if (Math.abs(ecart) > 0) {
          await tx.stock_article_magasin.update({
            where: {
              idStock: stock.idStock,
            },
            data: {
              quantitePhysique: quantiteReelle,
              quantiteDisponible: this.round2(
                quantiteReelle - quantiteReservee,
              ),
            },
          });

          await tx.mouvement_stock.create({
            data: {
              typeMouvement: 'INVENTAIRE',
              quantite: Math.abs(ecart),

              idArticle: stock.idArticle,

              idMagasinSource: ecart < 0 ? dto.idMagasin : null,
              idMagasinDestination: ecart > 0 ? dto.idMagasin : null,

              origineType: 'INVENTAIRE',
              origineId: null,

              commentaire: [
                'Inventaire direct',
                dto.commentaire?.trim(),
                `Article : ${stock.article.reference ?? stock.idArticle}`,
                `Théorique : ${quantiteTheorique}`,
                `Réel : ${quantiteReelle}`,
                `Écart : ${ecart}`,
              ]
                .filter(Boolean)
                .join(' | '),
            },
          });

          mouvementsCrees++;
          totalEcartsAbs += Math.abs(ecart);
        }

        resultats.push({
          idArticle: stock.idArticle,
          reference: stock.article.reference,
          designation: stock.article.designation,
          quantiteTheorique,
          quantiteReelle,
          ecart,
        });
      }

      return {
        message: 'Inventaire validé avec succès.',
        magasin: {
          idMagasin: magasin.idMagasin,
          code: magasin.code,
          libelle: magasin.libelle,
        },
        lignesControlees: resultats.length,
        mouvementsCrees,
        totalEcartsAbs: this.round2(totalEcartsAbs),
        lignes: resultats,
      };
    });
  }
}