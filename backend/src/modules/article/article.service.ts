import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateArticleDto,
  StockInitialDto,
  StockInitialMaterielDto,
} from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

type ArticleFlagsInput = {
  estModele?: boolean;
  gereEnStock?: boolean;
  gereParLot?: boolean;
  serialise?: boolean;
};

type ArticleForModeleSync = {
  idArticle: number;
  reference: string | null;
  designation: string | null;
  idFamille: number | null;
  reparable: boolean;
  actif: boolean;
};

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    famille: true,
    uniteArticle: true,
    modeleEquipement: true,
    consommations: true,
    stocks: true,
  };

  private normalizeRequiredText(value: string | undefined, message: string) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private parseOptionalDate(value?: string | Date | null) {
    if (!value) return undefined;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }

    return date;
  }

  private normalizeEtatArticle(value?: string | null, actif?: boolean) {
    if (value === 'INACTIF') {
      return {
        etatArticle: 'INACTIF',
        actif: false,
      };
    }

    if (value === 'ACTIF') {
      return {
        etatArticle: 'ACTIF',
        actif: true,
      };
    }

    if (actif === false) {
      return {
        etatArticle: 'INACTIF',
        actif: false,
      };
    }

    return {
      etatArticle: 'ACTIF',
      actif: true,
    };
  }

  private normalizeArticleFlags(dto: ArticleFlagsInput) {
    let estModele = dto.estModele ?? false;
    let gereEnStock = dto.gereEnStock ?? true;
    let gereParLot = dto.gereParLot ?? false;
    let serialise = dto.serialise ?? false;

    if (serialise) {
      estModele = true;
      gereEnStock = true;
      gereParLot = false;
    }

    if (gereParLot) {
      gereEnStock = true;
      serialise = false;
    }

    if (!gereEnStock) {
      gereParLot = false;
      serialise = false;
    }

    if (!estModele) {
      serialise = false;
    }

    return {
      estModele,
      gereEnStock,
      gereParLot,
      serialise,
    };
  }

  private async validateRelations(
    idFamille?: number | null,
    idUniteArticle?: number | null,
  ) {
    if (idFamille !== undefined && idFamille !== null) {
      const famille = await this.prisma.famille.findUnique({
        where: { idFamille },
      });

      if (!famille) {
        throw new BadRequestException('Famille introuvable.');
      }
    }

    if (idUniteArticle !== undefined && idUniteArticle !== null) {
      const unite = await this.prisma.unite_article.findUnique({
        where: { idUniteArticle },
      });

      if (!unite) {
        throw new BadRequestException("Unité d'article introuvable.");
      }
    }
  }

  private async ensureReferenceIsUnique(reference: string, idArticle?: number) {
    const existing = await this.prisma.article.findFirst({
      where: {
        reference,
        ...(idArticle ? { NOT: { idArticle } } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException('Un article avec ce code existe déjà.');
    }
  }

  private async getDefaultEtatModeleId(tx: any) {
    const etat = await tx.etat_modele.findFirst({
      orderBy: { idEtat: 'asc' },
    });

    if (!etat) {
      throw new BadRequestException(
        "Impossible de créer le modèle équipement : aucun état de modèle n'existe dans la table etat_modele.",
      );
    }

    return etat.idEtat;
  }

  private async getDefaultEtatMaterielId(tx: any) {
    const etat = await tx.etat_materiel.findFirst({
      orderBy: { idEtat: 'asc' },
    });

    return etat?.idEtat ?? null;
  }

  private async createOrSyncModeleFromArticleIfNeeded(
    tx: any,
    article: ArticleForModeleSync,
  ) {
    if (!article.reference) {
      throw new BadRequestException(
        'Impossible de créer un modèle équipement sans code article.',
      );
    }

    const linkedModele = await tx.modele.findFirst({
      where: { idArticle: article.idArticle },
    });

    if (linkedModele) {
      const modeleWithSameCode = await tx.modele.findFirst({
        where: {
          code: article.reference,
          NOT: { idModele: linkedModele.idModele },
        },
      });

      if (modeleWithSameCode) {
        throw new BadRequestException(
          'Un autre modèle équipement utilise déjà ce code.',
        );
      }

      return tx.modele.update({
        where: { idModele: linkedModele.idModele },
        data: {
          code: article.reference,
          libelle: article.designation,
          idFamille: article.idFamille,
          reparable: article.reparable,
          actif: article.actif,
        },
      });
    }

    const existingModeleByCode = await tx.modele.findFirst({
      where: { code: article.reference },
    });

    if (existingModeleByCode) {
      if (
        existingModeleByCode.idArticle !== null &&
        existingModeleByCode.idArticle !== article.idArticle
      ) {
        throw new BadRequestException(
          'Ce modèle équipement est déjà lié à un autre article.',
        );
      }

      return tx.modele.update({
        where: { idModele: existingModeleByCode.idModele },
        data: {
          idArticle: article.idArticle,
          libelle: article.designation,
          idFamille: article.idFamille,
          reparable: article.reparable,
          actif: article.actif,
        },
      });
    }

    const idEtat = await this.getDefaultEtatModeleId(tx);

    return tx.modele.create({
      data: {
        code: article.reference,
        libelle: article.designation,
        idFamille: article.idFamille,
        idArticle: article.idArticle,
        idEtat,
        reparable: article.reparable,
        actif: article.actif,
      },
    });
  }

  private async unlinkModeleFromArticleIfNeeded(tx: any, idArticle: number) {
    const linkedModele = await tx.modele.findFirst({
      where: { idArticle },
    });

    if (!linkedModele) return;

    await tx.modele.update({
      where: { idModele: linkedModele.idModele },
      data: { idArticle: null },
    });
  }

  private buildNumeroBonEntree(articleId: number) {
    const year = new Date().getFullYear();
    return `BE-AUTO-${year}-${articleId}-${Date.now()}`;
  }

  private shouldCreateStockInitial(stockInitial?: StockInitialDto) {
    if (!stockInitial) return false;

    const quantite = Number(stockInitial.quantite);

    return !Number.isNaN(quantite) && quantite > 0;
  }

  private validateSerializedInitialStock(
    quantite: number,
    materiels?: StockInitialMaterielDto[],
  ) {
    if (!Number.isInteger(quantite)) {
      throw new BadRequestException(
        'La quantité initiale d’un article sérialisé doit être un nombre entier.',
      );
    }

    if (!materiels || materiels.length === 0) {
      throw new BadRequestException(
        'Pour un article sérialisé, vous devez renseigner la liste des matériels.',
      );
    }

    if (materiels.length !== quantite) {
      throw new BadRequestException(
        `La quantité initiale est ${quantite}, donc vous devez renseigner exactement ${quantite} matériel(s).`,
      );
    }

    const codes = materiels.map((materiel) => materiel.code?.trim());

    if (codes.some((code) => !code)) {
      throw new BadRequestException(
        'Chaque matériel sérialisé doit avoir un code.',
      );
    }

    const duplicatedCode = codes.find(
      (code, index) => codes.indexOf(code) !== index,
    );

    if (duplicatedCode) {
      throw new BadRequestException(
        `Le code matériel "${duplicatedCode}" est répété plusieurs fois.`,
      );
    }

    const numerosSerie = materiels
      .map((materiel) => materiel.numeroSerie?.trim())
      .filter((numeroSerie): numeroSerie is string => Boolean(numeroSerie));

    const duplicatedNumeroSerie = numerosSerie.find(
      (numeroSerie, index) => numerosSerie.indexOf(numeroSerie) !== index,
    );

    if (duplicatedNumeroSerie) {
      throw new BadRequestException(
        `Le numéro de série "${duplicatedNumeroSerie}" est répété plusieurs fois.`,
      );
    }
  }

  private async ensureMaterielsAreUnique(
    tx: any,
    materiels: StockInitialMaterielDto[],
  ) {
    const codes = materiels.map((materiel) => materiel.code.trim());

    const numerosSerie = materiels
      .map((materiel) => materiel.numeroSerie?.trim())
      .filter((numeroSerie): numeroSerie is string => Boolean(numeroSerie));

    const existingMateriels = await tx.materiel.findMany({
      where: {
        OR: [
          {
            code: {
              in: codes,
            },
          },
          ...(numerosSerie.length > 0
            ? [
                {
                  numeroSerie: {
                    in: numerosSerie,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        code: true,
        numeroSerie: true,
      },
    });

    if (existingMateriels.length > 0) {
      const existing = existingMateriels[0];

      throw new BadRequestException(
        `Un matériel existe déjà avec le code "${existing.code}" ou le numéro de série "${existing.numeroSerie}".`,
      );
    }
  }

  private async createStockInitialForArticle(
    tx: any,
    article: {
      idArticle: number;
      reference: string | null;
      designation: string | null;
      serialise: boolean;
    },
    stockInitial: StockInitialDto,
    modeleId?: number | null,
  ) {
    const magasin = await tx.magasin.findUnique({
      where: { idMagasin: stockInitial.idMagasin },
    });

    if (!magasin) {
      throw new BadRequestException('Magasin introuvable.');
    }

    if (!magasin.actif) {
      throw new BadRequestException('Le magasin sélectionné est inactif.');
    }

    const quantite = Number(stockInitial.quantite);

    if (Number.isNaN(quantite) || quantite <= 0) {
      throw new BadRequestException(
        'La quantité initiale doit être supérieure à 0.',
      );
    }

    const prixUnitaire =
      stockInitial.prixUnitaire !== undefined
        ? Number(stockInitial.prixUnitaire)
        : undefined;

    if (
      prixUnitaire !== undefined &&
      (Number.isNaN(prixUnitaire) || prixUnitaire < 0)
    ) {
      throw new BadRequestException(
        'Le prix unitaire du stock initial est invalide.',
      );
    }

    if (article.serialise) {
      this.validateSerializedInitialStock(quantite, stockInitial.materiels);

      if (!modeleId) {
        throw new BadRequestException(
          'Impossible de créer les matériels : aucun modèle équipement lié à l’article.',
        );
      }

      await this.ensureMaterielsAreUnique(tx, stockInitial.materiels ?? []);
    }

    const commentaire =
      this.normalizeOptionalText(stockInitial.observation) ??
      `Stock initial créé automatiquement lors de la création de l'article ${article.reference}.`;

    const entreeStock = await tx.entree_stock.create({
      data: {
        numero: this.buildNumeroBonEntree(article.idArticle),
        dateReception: new Date(),
        statut: 'VALIDEE',
        commentaire,
      },
    });

    const ligneEntree = await tx.entree_stock_ligne.create({
      data: {
        idEntreeStock: entreeStock.idEntreeStock,
        idArticle: article.idArticle,
        idMagasin: stockInitial.idMagasin,
        quantite,
        prixUnitaire,
        numeroLot: this.normalizeOptionalText(stockInitial.numeroLot),
        datePeremption: this.parseOptionalDate(stockInitial.datePeremption),
        commentaire,
      },
    });

    await tx.stock_article_magasin.upsert({
      where: {
        idArticle_idMagasin: {
          idArticle: article.idArticle,
          idMagasin: stockInitial.idMagasin,
        },
      },
      create: {
        idArticle: article.idArticle,
        idMagasin: stockInitial.idMagasin,
        quantitePhysique: quantite,
        quantiteReservee: 0,
        quantiteDisponible: quantite,
      },
      update: {
        quantitePhysique: {
          increment: quantite,
        },
        quantiteDisponible: {
          increment: quantite,
        },
      },
    });

    if (!article.serialise) {
      await tx.mouvement_stock.create({
        data: {
          typeMouvement: 'ENTREE',
          dateMouvement: new Date(),
          quantite,
          idArticle: article.idArticle,
          idMagasinDestination: stockInitial.idMagasin,
          origineType: 'ENTREE_STOCK',
          origineId: entreeStock.idEntreeStock,
          commentaire,
        },
      });

      return;
    }

    const idEtatMateriel = await this.getDefaultEtatMaterielId(tx);

    for (const materielDto of stockInitial.materiels ?? []) {
      const materiel = await tx.materiel.create({
        data: {
          code: materielDto.code.trim(),
          libelle:
            this.normalizeOptionalText(materielDto.libelle) ??
            article.designation,
          numeroSerie: this.normalizeOptionalText(materielDto.numeroSerie),

          gereEnStock: true,
          positionActuelle: 'EN_STOCK',

          idModele: modeleId,
          idEtat: idEtatMateriel,
          idLigneEntreeStock: ligneEntree.idLigneEntreeStock,

          actif: true,
        },
      });

      await tx.mouvement_stock.create({
        data: {
          typeMouvement: 'ENTREE',
          dateMouvement: new Date(),
          quantite: 1,
          idArticle: article.idArticle,
          idMateriel: materiel.idMateriel,
          idMagasinDestination: stockInitial.idMagasin,
          origineType: 'ENTREE_STOCK',
          origineId: entreeStock.idEntreeStock,
          commentaire: `${commentaire} - Matériel ${materiel.code}`,
        },
      });
    }
  }

  async create(createDto: CreateArticleDto) {
    const reference = this.normalizeRequiredText(
      createDto.reference,
      'Le code article est obligatoire.',
    );

    const designation = this.normalizeRequiredText(
      createDto.designation,
      'Le libellé est obligatoire.',
    );

    await this.ensureReferenceIsUnique(reference);

    await this.validateRelations(
      createDto.idFamille,
      createDto.idUniteArticle,
    );

    const etat = this.normalizeEtatArticle(
      createDto.etatArticle,
      createDto.actif,
    );

    const flags = this.normalizeArticleFlags({
      estModele: createDto.estModele,
      gereEnStock: createDto.gereEnStock,
      gereParLot: createDto.gereParLot,
      serialise: createDto.serialise,
    });

    const hasStockInitial = this.shouldCreateStockInitial(
      createDto.stockInitial,
    );

    if (hasStockInitial && !flags.gereEnStock) {
      throw new BadRequestException(
        "Impossible de créer un stock initial pour un article non géré en stock.",
      );
    }

    if (hasStockInitial && flags.gereParLot && !createDto.stockInitial?.numeroLot) {
      throw new BadRequestException(
        'Le numéro de lot est obligatoire pour un article géré par lots.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          reference,
          designation,
          description: this.normalizeOptionalText(createDto.description),

          etatArticle: etat.etatArticle,
          actif: etat.actif,

          categorie: createDto.categorie,

          idFamille: createDto.idFamille,
          idUniteArticle: createDto.idUniteArticle,

          fournisseurPrincipal: this.normalizeOptionalText(
            createDto.fournisseurPrincipal,
          ),
          fabricantArticle: this.normalizeOptionalText(
            createDto.fabricantArticle,
          ),
          referenceFabricant: this.normalizeOptionalText(
            createDto.referenceFabricant,
          ),
          nbDecimales: createDto.nbDecimales ?? 0,
          codeBarres: this.normalizeOptionalText(createDto.codeBarres),

          centreCout: this.normalizeOptionalText(createDto.centreCout),
          budget: this.normalizeOptionalText(createDto.budget),
          codeComptable: this.normalizeOptionalText(createDto.codeComptable),
          natureAchat: this.normalizeOptionalText(createDto.natureAchat),
          taxe: this.normalizeOptionalText(createDto.taxe),

          prixStandard: createDto.prixStandard,
          prixMoyenPondere: createDto.prixMoyenPondere,

          gereEnStock: flags.gereEnStock,
          gereParLot: flags.gereParLot,
          serialise: flags.serialise,
          estModele: flags.estModele,

          reparable: createDto.reparable ?? false,

          createdBy: this.normalizeOptionalText(createDto.createdBy),
          updatedBy: this.normalizeOptionalText(createDto.updatedBy),
        },
      });

      let modele: { idModele: number } | null = null;

      if (article.estModele) {
        modele = await this.createOrSyncModeleFromArticleIfNeeded(tx, article);
      }

      if (hasStockInitial && createDto.stockInitial) {
        await this.createStockInitialForArticle(
          tx,
          {
            idArticle: article.idArticle,
            reference: article.reference,
            designation: article.designation,
            serialise: article.serialise,
          },
          createDto.stockInitial,
          modele?.idModele,
        );
      }

      return tx.article.findUnique({
        where: { idArticle: article.idArticle },
        include: this.includeRelations,
      });
    });
  }

  async findAll() {
    return this.prisma.article.findMany({
      include: this.includeRelations,
      orderBy: { reference: 'asc' },
    });
  }

  async findOne(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { idArticle: id },
      include: this.includeRelations,
    });

    if (!article) {
      throw new NotFoundException('Article introuvable.');
    }

    return article;
  }

  async update(id: number, updateDto: UpdateArticleDto) {
    const existingArticle = await this.prisma.article.findUnique({
      where: { idArticle: id },
    });

    if (!existingArticle) {
      throw new NotFoundException('Article introuvable.');
    }

    let reference: string | undefined;

    if (updateDto.reference !== undefined) {
      reference = this.normalizeRequiredText(
        updateDto.reference,
        'Le code article est obligatoire.',
      );

      await this.ensureReferenceIsUnique(reference, id);
    }

    let designation: string | undefined;

    if (updateDto.designation !== undefined) {
      designation = this.normalizeRequiredText(
        updateDto.designation,
        'Le libellé est obligatoire.',
      );
    }

    await this.validateRelations(
      updateDto.idFamille,
      updateDto.idUniteArticle,
    );

    const futureEtatArticle =
      updateDto.etatArticle ??
      existingArticle.etatArticle ??
      (existingArticle.actif ? 'ACTIF' : 'INACTIF');

    const futureActif =
      updateDto.actif !== undefined ? updateDto.actif : existingArticle.actif;

    const etat = this.normalizeEtatArticle(futureEtatArticle, futureActif);

    let futureSerialise = updateDto.serialise ?? existingArticle.serialise;

    if (updateDto.estModele === false || updateDto.gereEnStock === false) {
      futureSerialise = false;
    }

    if (updateDto.gereParLot === true) {
      futureSerialise = false;
    }

    if (updateDto.serialise === true) {
      futureSerialise = true;
    }

    const flags = this.normalizeArticleFlags({
      estModele: updateDto.estModele ?? existingArticle.estModele,
      gereEnStock: updateDto.gereEnStock ?? existingArticle.gereEnStock,
      gereParLot: updateDto.gereParLot ?? existingArticle.gereParLot,
      serialise: futureSerialise,
    });

    return this.prisma.$transaction(async (tx) => {
      const article = await tx.article.update({
        where: { idArticle: id },
        data: {
          ...(reference !== undefined && { reference }),
          ...(designation !== undefined && { designation }),

          ...(updateDto.description !== undefined && {
            description: this.normalizeOptionalText(updateDto.description),
          }),

          etatArticle: etat.etatArticle,
          actif: etat.actif,

          ...(updateDto.categorie !== undefined && {
            categorie: updateDto.categorie,
          }),

          ...(updateDto.idFamille !== undefined && {
            idFamille: updateDto.idFamille,
          }),

          ...(updateDto.idUniteArticle !== undefined && {
            idUniteArticle: updateDto.idUniteArticle,
          }),

          ...(updateDto.fournisseurPrincipal !== undefined && {
            fournisseurPrincipal: this.normalizeOptionalText(
              updateDto.fournisseurPrincipal,
            ),
          }),

          ...(updateDto.fabricantArticle !== undefined && {
            fabricantArticle: this.normalizeOptionalText(
              updateDto.fabricantArticle,
            ),
          }),

          ...(updateDto.referenceFabricant !== undefined && {
            referenceFabricant: this.normalizeOptionalText(
              updateDto.referenceFabricant,
            ),
          }),

          ...(updateDto.nbDecimales !== undefined && {
            nbDecimales: updateDto.nbDecimales,
          }),

          ...(updateDto.codeBarres !== undefined && {
            codeBarres: this.normalizeOptionalText(updateDto.codeBarres),
          }),

          ...(updateDto.centreCout !== undefined && {
            centreCout: this.normalizeOptionalText(updateDto.centreCout),
          }),

          ...(updateDto.budget !== undefined && {
            budget: this.normalizeOptionalText(updateDto.budget),
          }),

          ...(updateDto.codeComptable !== undefined && {
            codeComptable: this.normalizeOptionalText(
              updateDto.codeComptable,
            ),
          }),

          ...(updateDto.natureAchat !== undefined && {
            natureAchat: this.normalizeOptionalText(updateDto.natureAchat),
          }),

          ...(updateDto.taxe !== undefined && {
            taxe: this.normalizeOptionalText(updateDto.taxe),
          }),

          ...(updateDto.prixStandard !== undefined && {
            prixStandard: updateDto.prixStandard,
          }),

          ...(updateDto.prixMoyenPondere !== undefined && {
            prixMoyenPondere: updateDto.prixMoyenPondere,
          }),

          estModele: flags.estModele,
          gereEnStock: flags.gereEnStock,
          gereParLot: flags.gereParLot,
          serialise: flags.serialise,

          ...(updateDto.reparable !== undefined && {
            reparable: updateDto.reparable,
          }),

          ...(updateDto.updatedBy !== undefined && {
            updatedBy: this.normalizeOptionalText(updateDto.updatedBy),
          }),
        },
      });

      if (article.estModele) {
        await this.createOrSyncModeleFromArticleIfNeeded(tx, article);
      } else {
        await this.unlinkModeleFromArticleIfNeeded(tx, article.idArticle);
      }

      return tx.article.findUnique({
        where: { idArticle: article.idArticle },
        include: this.includeRelations,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const linkedModeleCount = await this.prisma.modele.count({
      where: { idArticle: id },
    });

    if (linkedModeleCount > 0) {
      throw new BadRequestException(
        "Impossible de supprimer cet article car il est lié à un modèle équipement. Décoche d'abord 'Modèle' ou supprime le modèle correspondant.",
      );
    }

    const consommationCount = await this.prisma.consommation.count({
      where: { idArticle: id },
    });

    if (consommationCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cet article car il est utilisé dans des consommations.',
      );
    }

    const stockCount = await this.prisma.stock_article_magasin.count({
      where: { idArticle: id },
    });

    if (stockCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cet article car il possède une ligne de stock.',
      );
    }

    const mouvementCount = await this.prisma.mouvement_stock.count({
      where: { idArticle: id },
    });

    if (mouvementCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cet article car il possède des mouvements de stock.',
      );
    }

    return this.prisma.article.delete({
      where: { idArticle: id },
    });
  }
}