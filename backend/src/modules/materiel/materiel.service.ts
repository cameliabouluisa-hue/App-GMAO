import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';
import { ChangeEtatMaterielDto } from './dto/change-etat-materiel.dto';
import { UpdateCycleVieMaterielDto } from './dto/update-cycle-vie-materiel.dto';

const ETATS_INTERVENTION_AUTORISES = ['VALIDE', 'EN_PANNE', 'EN_REVISION'];

const TRANSITIONS_MATERIEL_AUTORISEES: Record<string, string[]> = {
  EN_PREPARATION: ['ATTENTE_VALIDATION', 'VALIDE', 'ANNULE'],
  ATTENTE_VALIDATION: ['VALIDE', 'ANNULE'],

  VALIDE: ['EN_PANNE', 'EN_REVISION', 'AU_REBUT'],
  EN_PANNE: ['EN_REVISION', 'VALIDE', 'AU_REBUT'],
  EN_REVISION: ['EN_PANNE', 'VALIDE', 'AU_REBUT'],

  AU_REBUT: ['VALIDE', 'ANNULE'],
  ANNULE: [],
};

@Injectable()
export class MaterielService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    modele: {
      include: {
        article: true,
        famille: true,
        etat_modele: true,
        type_equipement: true,
        fabricant: true,
        marque: true,
        plan_preventif_predefini: true,
        modele_plan_preventif_predefini: {
          include: {
            plan_preventif_predefini: true,
          },
        },
      },
    },

    etat_materiel: true,
    type_materiel: true,
    point_structure: true,

    entreeStockLigne: {
      include: {
        entreeStock: true,
        article: true,
        magasin: true,
        emplacement: true,
      },
    },

    materielParent: {
      include: {
        etat_materiel: true,
        type_materiel: true,
        modele: true,
      },
    },

    sousMateriels: {
      include: {
        etat_materiel: true,
        type_materiel: true,
        modele: true,
      },
    },

    points_mesure: {
      orderBy: {
        idPointMesure: 'asc',
      },
    },

    plan_preventif: {
      include: {
        plan_preventif_declencheur: {
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

    intervention: {
      include: {
        demande_intervention: true,
        gamme: true,
        equipe_maintenance: true,
        plan_preventif: true,
      },
      orderBy: {
        idIntervention: 'desc',
      },
      take: 10,
    },

    mouvementsStock: {
      include: {
        article: true,
        magasinSource: true,
        magasinDestination: true,
      },
      orderBy: {
        dateMouvement: 'desc',
      },
      take: 10,
    },

    lignesInventairePrepare: {
      include: {
        inventairePrepare: true,
        article: true,
      },
      orderBy: {
        idLigneInventairePrepare: 'desc',
      },
      take: 10,
    },

    lignesSortieStock: {
      include: {
        sortieStock: true,
        article: true,
        magasin: true,
        emplacement: true,
      },
      orderBy: {
        idLigneSortieStock: 'desc',
      },
      take: 10,
    },
  } as const;

  private formatMateriel(materiel: any) {
    const plansMap = new Map<number, any>();

    const plansDirects = materiel.modele?.plan_preventif_predefini ?? [];

    for (const plan of plansDirects) {
      if (plan?.actif === false) continue;

      plansMap.set(plan.idPlanPreventifPredefini, {
        ...plan,
        principal: false,
        actifAssociation: true,
        origineAssociation: 'MODELE_DIRECT',
      });
    }

    const liaisons =
      materiel.modele?.modele_plan_preventif_predefini ?? [];

    for (const liaison of liaisons) {
      if (liaison?.actif === false) continue;
      if (!liaison?.plan_preventif_predefini) continue;
      if (liaison.plan_preventif_predefini.actif === false) continue;

      plansMap.set(liaison.idPlanPreventifPredefini, {
        ...liaison.plan_preventif_predefini,
        principal: liaison.principal,
        actifAssociation: liaison.actif,
        idModelePlanPreventifPredefini:
          liaison.idModelePlanPreventifPredefini,
        origineAssociation: 'TABLE_LIAISON',
      });
    }

    const plansPreventifsPredefinisModele = Array.from(plansMap.values());

    const dateFinGarantiePrevisionnelle =
      this.calculerDateFinGarantie(
        materiel.dateMiseService,
        materiel.modele?.garantieMois,
      );

    return {
      ...materiel,
      plansPreventifsPredefinisModele,
      dateFinGarantiePrevisionnelle,
    };
  }

  async create(createDto: CreateMaterielDto) {
    const code = this.normalizeRequiredString(
      createDto.code,
      'Le code du matériel est obligatoire.',
    );

    const libelle = this.normalizeRequiredString(
      createDto.libelle,
      'Le libellé du matériel est obligatoire.',
    );

    await this.checkUniqueCode(code);
    await this.checkUniqueNumeroSerie(createDto.numeroSerie);

    const refs = this.normalizeReferences(createDto);
    await this.validateReferences(refs);

    const idEtatRecu = this.normalizeOptionalNumber(
      createDto.idEtat,
      'État matériel',
    );
    const idEtat = await this.resolveEtatCreation(idEtatRecu);
    const etat = await this.findEtatOrFail(idEtat);

    const gereEnStock =
      this.normalizeOptionalBoolean(createDto.gereEnStock, 'Géré en stock') ??
      false;

    const dateDernierInventaire = this.parseOptionalDate(
      createDto.dateDernierInventaire,
    );

    if (gereEnStock === true && dateDernierInventaire !== null) {
      throw new BadRequestException(
        "Le dernier inventaire d'un matériel géré en stock doit être mis à jour depuis le module stock.",
      );
    }

    const positionActuelle =
      this.normalizeOptionalString(createDto.positionActuelle) ??
      (gereEnStock ? 'EN_STOCK' : 'SUR_TERRAIN');

    const actif =
      this.normalizeOptionalBoolean(createDto.actif, 'Actif') ?? true;

    const data: any = {
      code,
      libelle,
      numeroSerie: this.normalizeOptionalString(createDto.numeroSerie),

      dateMiseService: this.parseOptionalDate(createDto.dateMiseService),
      dateDernierInventaire,
      dateRebut: this.parseOptionalDate(createDto.dateRebut),
      motifRebut: this.normalizeOptionalString(createDto.motifRebut),

      gereEnStock,
      positionActuelle,

      idModele: refs.idModele ?? null,
      idEtat,
      idType: refs.idType ?? null,
      idPointStructure: refs.idPointStructure ?? null,
      idMaterielParent: refs.idMaterielParent ?? null,
      idLigneEntreeStock: refs.idLigneEntreeStock ?? null,

      actif,
    };

    this.appliquerEffetsEtat(data, this.getCodeEtat(etat), createDto.motifRebut);

    const materiel = await this.prisma.materiel.create({
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(materiel);
  }

  async findAll() {
    const materiels = await this.prisma.materiel.findMany({
      orderBy: {
        idMateriel: 'desc',
      },
      include: this.includeRelations,
    });

    return materiels.map((materiel) => this.formatMateriel(materiel));
  }

  async findOne(id: number) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const materiel = await this.prisma.materiel.findUnique({
      where: {
        idMateriel,
      },
      include: this.includeRelations,
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }

    return this.formatMateriel(materiel);
  }

  async update(id: number, updateDto: UpdateMaterielDto) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const materiel = await this.findOne(idMateriel);

    const data: any = {};

    if (updateDto.code !== undefined) {
      const code = this.normalizeRequiredString(
        updateDto.code,
        'Le code du matériel est obligatoire.',
      );

      await this.checkUniqueCode(code, idMateriel);
      data.code = code;
    }

    if (updateDto.libelle !== undefined) {
      data.libelle = this.normalizeRequiredString(
        updateDto.libelle,
        'Le libellé du matériel est obligatoire.',
      );
    }

    if (updateDto.numeroSerie !== undefined) {
      await this.checkUniqueNumeroSerie(updateDto.numeroSerie, idMateriel);
      data.numeroSerie = this.normalizeOptionalString(updateDto.numeroSerie);
    }

    if (updateDto.idEtat !== undefined) {
      const idEtat = this.normalizeRequiredNumber(
        updateDto.idEtat,
        "L'état du matériel est obligatoire.",
        'État matériel invalide.',
      );

      const nouvelEtat = await this.findEtatOrFail(idEtat);

      const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
      const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

      this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

      data.idEtat = idEtat;
      this.appliquerEffetsEtat(data, nouveauCodeEtat, updateDto.motifRebut);
    }

    const refs = this.normalizeReferences(updateDto);
    await this.validateReferences(refs, idMateriel);

    if (refs.idModele !== undefined) {
      data.idModele = refs.idModele;
    }

    if (refs.idType !== undefined) {
      data.idType = refs.idType;
    }

    if (refs.idPointStructure !== undefined) {
      data.idPointStructure = refs.idPointStructure;
    }

    if (refs.idMaterielParent !== undefined) {
      data.idMaterielParent = refs.idMaterielParent;
    }

    if (refs.idLigneEntreeStock !== undefined) {
      data.idLigneEntreeStock = refs.idLigneEntreeStock;
    }

    const gereEnStock = this.normalizeOptionalBoolean(
      updateDto.gereEnStock,
      'Géré en stock',
    );

    const finalGereEnStock = gereEnStock ?? materiel.gereEnStock ?? false;

    if (updateDto.dateMiseService !== undefined) {
      data.dateMiseService = this.parseOptionalDate(updateDto.dateMiseService);
    }

    if (updateDto.dateDernierInventaire !== undefined) {
      const nouvelleDateDernierInventaire = this.parseOptionalDate(
        updateDto.dateDernierInventaire,
      );

      if (
        finalGereEnStock === true &&
        !this.sameDateValue(
          nouvelleDateDernierInventaire,
          materiel.dateDernierInventaire,
        )
      ) {
        throw new BadRequestException(
          "Le dernier inventaire d'un matériel géré en stock doit être modifié depuis le module stock.",
        );
      }

      if (finalGereEnStock !== true) {
        data.dateDernierInventaire = nouvelleDateDernierInventaire;
      }
    }

    if (updateDto.dateRebut !== undefined) {
      data.dateRebut = this.parseOptionalDate(updateDto.dateRebut);
    }

    if (updateDto.motifRebut !== undefined) {
      data.motifRebut = this.normalizeOptionalString(updateDto.motifRebut);
    }

    if (gereEnStock !== undefined) {
      data.gereEnStock = gereEnStock;
    }

    if (updateDto.positionActuelle !== undefined) {
      data.positionActuelle = this.normalizeOptionalString(
        updateDto.positionActuelle,
      );
    }

    const actif = this.normalizeOptionalBoolean(updateDto.actif, 'Actif');

    if (actif !== undefined) {
      data.actif = actif;
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel,
      },
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async updateCycleVie(id: number, dto: UpdateCycleVieMaterielDto) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const materiel = await this.findOne(idMateriel);

    const data: any = {};

    if (dto.idEtat !== undefined) {
      const idEtat = this.normalizeRequiredNumber(
        dto.idEtat,
        "L'état du matériel est obligatoire.",
        'État matériel invalide.',
      );

      const nouvelEtat = await this.findEtatOrFail(idEtat);

      const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
      const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

      this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

      data.idEtat = idEtat;
      this.appliquerEffetsEtat(data, nouveauCodeEtat, dto.motifRebut);
    }

    if (dto.dateMiseService !== undefined) {
      data.dateMiseService = this.parseOptionalDate(dto.dateMiseService);
    }

    if (dto.dateDernierInventaire !== undefined) {
      const nouvelleDateDernierInventaire = this.parseOptionalDate(
        dto.dateDernierInventaire,
      );

      if (
        materiel.gereEnStock === true &&
        !this.sameDateValue(
          nouvelleDateDernierInventaire,
          materiel.dateDernierInventaire,
        )
      ) {
        throw new BadRequestException(
          "Ce matériel est géré en stock. Son dernier inventaire doit être modifié depuis le module stock.",
        );
      }

      if (materiel.gereEnStock !== true) {
        data.dateDernierInventaire = nouvelleDateDernierInventaire;
      }
    }

    if (dto.dateRebut !== undefined) {
      data.dateRebut = this.parseOptionalDate(dto.dateRebut);
    }

    if (dto.motifRebut !== undefined) {
      data.motifRebut = this.normalizeOptionalString(dto.motifRebut);
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel,
      },
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async changerEtatMateriel(id: number, dto: ChangeEtatMaterielDto) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const idEtat = this.normalizeRequiredNumber(
      dto.idEtat,
      "L'état du matériel est obligatoire.",
      'État matériel invalide.',
    );

    const materiel = await this.findOne(idMateriel);
    const nouvelEtat = await this.findEtatOrFail(idEtat);

    const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
    const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

    this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

    const data: any = {
      idEtat,
    };

    this.appliquerEffetsEtat(data, nouveauCodeEtat, dto.motif);

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel,
      },
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async verifierInterventionPossible(id: number) {
    const materiel = await this.findOne(id);
    const codeEtat = materiel.etat_materiel?.code;

    if (!codeEtat) {
      throw new BadRequestException(
        "L'état du matériel n'a pas de code. Vérifie la table etat_materiel.",
      );
    }

    if (!ETATS_INTERVENTION_AUTORISES.includes(codeEtat)) {
      throw new BadRequestException(
        'Ce matériel ne peut pas être ciblé par une intervention. Il doit être Validé, En panne ou En révision.',
      );
    }

    return {
      possible: true,
      message: 'Le matériel peut être ciblé par une intervention.',
      materiel,
    };
  }

  async updateDernierInventaireDepuisStock(
    idMateriel: number,
    dateInventaire: Date,
  ) {
    const idMaterielNormalise = this.normalizeRequiredNumber(
      idMateriel,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const materiel = await this.findOne(idMaterielNormalise);

    if (materiel.gereEnStock !== true) {
      throw new BadRequestException(
        "Ce matériel n'est pas géré en stock. Son inventaire doit être modifié manuellement depuis la fiche matériel.",
      );
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel: idMaterielNormalise,
      },
      data: {
        dateDernierInventaire: this.parseRequiredDate(
          dateInventaire,
          'Date inventaire invalide.',
        ),
      },
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async genererPlanPreventifDepuisPPP(
    idMateriel: number,
    idPlanPreventifPredefini: number,
  ) {
    const idMaterielNormalise = this.normalizeRequiredNumber(
      idMateriel,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const idPlanNormalise = this.normalizeRequiredNumber(
      idPlanPreventifPredefini,
      'Identifiant du plan préventif prédéfini obligatoire.',
      'Identifiant du plan préventif prédéfini invalide.',
    );

    const materiel = await this.findOne(idMaterielNormalise);

    if (!materiel.idModele) {
      throw new BadRequestException(
        'Ce matériel n’a pas de modèle. Impossible de générer un plan préventif prédéfini.',
      );
    }

    const ppp = await this.prisma.plan_preventif_predefini.findFirst({
      where: {
        idPlanPreventifPredefini: idPlanNormalise,
        actif: true,
        OR: [
          { idModele: materiel.idModele },
          {
            modele_plan_preventif_predefini: {
              some: {
                idModele: materiel.idModele,
                actif: true,
              },
            },
          },
        ],
      },
      include: {
        ppp_declencheur: true,
      },
    });

    if (!ppp) {
      throw new NotFoundException(
        'Plan préventif prédéfini introuvable pour le modèle de ce matériel.',
      );
    }

    const existing = await this.prisma.plan_preventif.findFirst({
      where: {
        idMateriel: idMaterielNormalise,
        idPlanPreventifPredefiniSource: idPlanNormalise,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Ce plan préventif a déjà été généré pour ce matériel.',
      );
    }

    const plan = await this.prisma.plan_preventif.create({
      data: {
        code: `PP-${materiel.code || idMaterielNormalise}-${ppp.code}`,
        libelle: ppp.titre || ppp.code,
        etat: ppp.etat || 'ACTIF',
        typeDeclenchement: ppp.typeDeclenchement,
        organisation: ppp.organisation,
        idMateriel: idMaterielNormalise,
        idPlanPreventifPredefiniSource: ppp.idPlanPreventifPredefini,
        actif: true,
      },
    });

    for (const declencheur of ppp.ppp_declencheur) {
      await this.prisma.plan_preventif_declencheur.create({
        data: {
          idPlanPreventif: plan.idPlanPreventif,
          idPppDeclencheurSource: declencheur.idPppDeclencheur,
          priorite: declencheur.priorite,
          etat: declencheur.etat,
          typeDeclencheur: declencheur.typeDeclencheur,
          idGamme: declencheur.idGamme,
          idMateriel: idMaterielNormalise,
          idModele: materiel.idModele,
          idPointMesure: declencheur.idPointMesure,
          etatInterventionCible: declencheur.etatInterventionCible,
          horizonJours: declencheur.horizonJours,
          toleranceJours: declencheur.toleranceJours,
          actualisation: declencheur.actualisation,
          periodiciteValeur: declencheur.periodiciteValeur,
          periodiciteUnite: declencheur.periodiciteUnite,
          seuilValeur: declencheur.seuilValeur,
          operateur: declencheur.operateur,
          symptomeCode: declencheur.symptomeCode,
          saisonnaliteDu: declencheur.saisonnaliteDu,
          saisonnaliteAu: declencheur.saisonnaliteAu,
          actif: declencheur.actif ?? true,
        },
      });
    }

    return this.findOne(idMaterielNormalise);
  }

  async findEtatsMateriel() {
    return this.prisma.etat_materiel.findMany({
      orderBy: {
        idEtat: 'asc',
      },
    });
  }

  async findTypesMateriel() {
    return this.prisma.type_materiel.findMany({
      orderBy: {
        idType: 'asc',
      },
    });
  }

  async remove(id: number) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    await this.findOne(idMateriel);

    return this.prisma.materiel.delete({
      where: {
        idMateriel,
      },
    });
  }

  async restore(id: number) {
    const idMateriel = this.normalizeRequiredNumber(
      id,
      'Identifiant du matériel obligatoire.',
      'Identifiant du matériel invalide.',
    );

    const materiel = await this.prisma.materiel.findUnique({
      where: { idMateriel },
    });

    if (!materiel) {
      throw new NotFoundException(`Matériel ${idMateriel} introuvable.`);
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: { idMateriel },
      data: {
        actif: true,
      },
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  private async resolveEtatCreation(idEtat?: number | null) {
    if (idEtat !== undefined && idEtat !== null) {
      return idEtat;
    }

    const etatPreparation = await this.prisma.etat_materiel.findFirst({
      where: {
        code: 'EN_PREPARATION',
      },
    });

    if (!etatPreparation) {
      throw new BadRequestException(
        "Aucun état EN_PREPARATION n'existe dans la table etat_materiel.",
      );
    }

    return etatPreparation.idEtat;
  }

  private normalizeReferences(dto: {
    idModele?: any;
    idType?: any;
    idPointStructure?: any;
    idMaterielParent?: any;
    idLigneEntreeStock?: any;
  }) {
    return {
      idModele: this.normalizeOptionalNumber(dto.idModele, 'Modèle'),
      idType: this.normalizeOptionalNumber(dto.idType, 'Type de matériel'),
      idPointStructure: this.normalizeOptionalNumber(
        dto.idPointStructure,
        'Point de structure',
      ),
      idMaterielParent: this.normalizeOptionalNumber(
        dto.idMaterielParent,
        'Matériel parent',
      ),
      idLigneEntreeStock: this.normalizeOptionalNumber(
        dto.idLigneEntreeStock,
        'Ligne entrée stock',
      ),
    };
  }

  private async validateReferences(
    dto: {
      idModele?: number | null;
      idType?: number | null;
      idPointStructure?: number | null;
      idMaterielParent?: number | null;
      idLigneEntreeStock?: number | null;
    },
    currentId?: number,
  ) {
    if (dto.idModele !== undefined && dto.idModele !== null) {
      const modele = await this.prisma.modele.findUnique({
        where: {
          idModele: dto.idModele,
        },
      });

      if (!modele) {
        throw new NotFoundException('Modèle introuvable.');
      }
    }

    if (dto.idType !== undefined && dto.idType !== null) {
      const type = await this.prisma.type_materiel.findUnique({
        where: {
          idType: dto.idType,
        },
      });

      if (!type) {
        throw new NotFoundException('Type de matériel introuvable.');
      }
    }

    if (
      dto.idPointStructure !== undefined &&
      dto.idPointStructure !== null
    ) {
      const point = await this.prisma.point_structure.findUnique({
        where: {
          idPoint: dto.idPointStructure,
        },
      });

      if (!point) {
        throw new NotFoundException('Point de structure introuvable.');
      }
    }

    if (
      dto.idMaterielParent !== undefined &&
      dto.idMaterielParent !== null
    ) {
      if (currentId && dto.idMaterielParent === currentId) {
        throw new BadRequestException(
          'Un matériel ne peut pas être son propre père matériel.',
        );
      }

      const parent = await this.prisma.materiel.findUnique({
        where: {
          idMateriel: dto.idMaterielParent,
        },
      });

      if (!parent) {
        throw new NotFoundException('Matériel parent introuvable.');
      }
    }

    if (
      dto.idLigneEntreeStock !== undefined &&
      dto.idLigneEntreeStock !== null
    ) {
      const ligneEntree = await this.prisma.entree_stock_ligne.findUnique({
        where: {
          idLigneEntreeStock: dto.idLigneEntreeStock,
        },
      });

      if (!ligneEntree) {
        throw new NotFoundException('Ligne d’entrée stock introuvable.');
      }
    }
  }

  private async findEtatOrFail(idEtat: number) {
    const idEtatNormalise = this.normalizeRequiredNumber(
      idEtat,
      "L'état du matériel est obligatoire.",
      'État matériel invalide.',
    );

    const etat = await this.prisma.etat_materiel.findUnique({
      where: {
        idEtat: idEtatNormalise,
      },
    });

    if (!etat) {
      throw new NotFoundException('État matériel introuvable.');
    }

    return etat;
  }

  private async checkUniqueCode(code: string, currentId?: number) {
    const existing = await this.prisma.materiel.findFirst({
      where: {
        code,
        ...(currentId
          ? {
              NOT: {
                idMateriel: currentId,
              },
            }
          : {}),
      },
    });

    if (existing) {
      throw new BadRequestException('Un matériel avec ce code existe déjà.');
    }
  }

  private async checkUniqueNumeroSerie(
    numeroSerie?: string | null,
    currentId?: number,
  ) {
    const normalized = this.normalizeOptionalString(numeroSerie);

    if (!normalized) return;

    const existing = await this.prisma.materiel.findFirst({
      where: {
        numeroSerie: normalized,
        ...(currentId
          ? {
              NOT: {
                idMateriel: currentId,
              },
            }
          : {}),
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Un matériel avec ce numéro de série existe déjà.',
      );
    }
  }

  private getCodeEtat(etat: { code: string | null }) {
    if (!etat.code) {
      throw new BadRequestException(
        "Le code de l'état matériel n'est pas renseigné dans la table etat_materiel.",
      );
    }

    return etat.code;
  }

  private verifierTransitionEtat(
    ancienCodeEtat: string | null,
    nouveauCodeEtat: string,
  ) {
    if (!ancienCodeEtat) return;

    if (ancienCodeEtat === nouveauCodeEtat) return;

    const transitionsPossibles =
      TRANSITIONS_MATERIEL_AUTORISEES[ancienCodeEtat] ?? [];

    if (!transitionsPossibles.includes(nouveauCodeEtat)) {
      throw new BadRequestException(
        `Transition non autorisée : ${ancienCodeEtat} → ${nouveauCodeEtat}.`,
      );
    }
  }

  private appliquerEffetsEtat(
    data: any,
    nouveauCodeEtat: string,
    motif?: string | null,
  ) {
    if (nouveauCodeEtat === 'AU_REBUT') {
      data.positionActuelle = 'AU_REBUT';

      if (!data.dateRebut) {
        data.dateRebut = new Date();
      }

      data.motifRebut = this.normalizeOptionalString(motif) ?? data.motifRebut;
    }

    if (nouveauCodeEtat === 'ANNULE') {
      data.actif = false;
    }

    if (nouveauCodeEtat === 'VALIDE') {
      data.actif = true;
    }
  }

  private normalizeOptionalString(value?: any) {
    if (value === undefined || value === null) return null;

    const trimmed = String(value).trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeRequiredString(value: any, message: string) {
    const trimmed = String(value ?? '').trim();

    if (!trimmed) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }

  private normalizeOptionalNumber(value: any, fieldName: string) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(`${fieldName} invalide.`);
    }

    return numberValue;
  }

  private normalizeRequiredNumber(
    value: any,
    requiredMessage: string,
    invalidMessage: string,
  ) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(requiredMessage);
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(invalidMessage);
    }

    return numberValue;
  }

  private normalizeOptionalBoolean(value: any, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    const normalized = String(value).trim().toLowerCase();

    if (['true', '1', 'oui', 'yes', 'actif', 'active'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'non', 'no', 'inactif', 'inactive'].includes(normalized)) {
      return false;
    }

    throw new BadRequestException(`${fieldName} invalide.`);
  }

  private parseOptionalDate(value?: any) {
    if (value === undefined || value === null || value === '') return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }

    return date;
  }

  private parseRequiredDate(value: any, message: string) {
    const date = this.parseOptionalDate(value);

    if (!date) {
      throw new BadRequestException(message);
    }

    return date;
  }

  private sameDateValue(dateA?: Date | string | null, dateB?: Date | string | null) {
    const keyA = this.toDateKey(dateA);
    const keyB = this.toDateKey(dateB);

    return keyA === keyB;
  }

  private toDateKey(value?: Date | string | null) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }

    return date.toISOString().slice(0, 10);
  }

  private calculerDateFinGarantie(
    dateMiseService?: Date | string | null,
    garantieMois?: number | null,
  ) {
    if (!dateMiseService || !garantieMois) return null;

    const date = new Date(dateMiseService);

    if (Number.isNaN(date.getTime())) return null;

    date.setMonth(date.getMonth() + garantieMois);

    return date;
  }
}
