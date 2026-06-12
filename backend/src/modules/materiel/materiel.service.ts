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

    const idEtat = await this.resolveEtatCreation(createDto.idEtat);

    await this.findEtatOrFail(idEtat);
    await this.validateReferences(createDto);

    const gereEnStock = createDto.gereEnStock ?? false;

    if (gereEnStock && createDto.dateDernierInventaire) {
      throw new BadRequestException(
        "Le dernier inventaire d'un matériel géré en stock doit être mis à jour depuis le module stock.",
      );
    }

    const positionActuelle =
      this.normalizeOptionalString(createDto.positionActuelle) ??
      (gereEnStock ? 'EN_STOCK' : 'SUR_TERRAIN');

    const data: any = {
      code,
      libelle,
      numeroSerie: this.normalizeOptionalString(createDto.numeroSerie),

      dateMiseService: this.parseOptionalDate(createDto.dateMiseService),
      dateDernierInventaire: this.parseOptionalDate(
        createDto.dateDernierInventaire,
      ),
      dateRebut: this.parseOptionalDate(createDto.dateRebut),
      motifRebut: this.normalizeOptionalString(createDto.motifRebut),

      gereEnStock,
      positionActuelle,

      idModele: createDto.idModele ?? null,
      idEtat,
      idType: createDto.idType ?? null,
      idPointStructure: createDto.idPointStructure ?? null,
      idMaterielParent: createDto.idMaterielParent ?? null,
      idLigneEntreeStock: createDto.idLigneEntreeStock ?? null,

      actif: createDto.actif ?? true,
    };

    const etat = await this.findEtatOrFail(idEtat);
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
    const materiel = await this.prisma.materiel.findUnique({
      where: {
        idMateriel: id,
      },
      include: this.includeRelations,
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }

    return this.formatMateriel(materiel);
  }

  async update(id: number, updateDto: UpdateMaterielDto) {
    const materiel = await this.findOne(id);

    const data: any = {};

    if (updateDto.code !== undefined) {
      const code = this.normalizeRequiredString(
        updateDto.code,
        'Le code du matériel est obligatoire.',
      );

      await this.checkUniqueCode(code, id);
      data.code = code;
    }

    if (updateDto.libelle !== undefined) {
      data.libelle = this.normalizeRequiredString(
        updateDto.libelle,
        'Le libellé du matériel est obligatoire.',
      );
    }

    if (updateDto.numeroSerie !== undefined) {
      await this.checkUniqueNumeroSerie(updateDto.numeroSerie, id);
      data.numeroSerie = this.normalizeOptionalString(updateDto.numeroSerie);
    }

    if (updateDto.idEtat !== undefined) {
      if (updateDto.idEtat === null) {
        throw new BadRequestException("L'état du matériel est obligatoire.");
      }

      const nouvelEtat = await this.findEtatOrFail(updateDto.idEtat);

      const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
      const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

      this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

      data.idEtat = updateDto.idEtat;
      this.appliquerEffetsEtat(data, nouveauCodeEtat, updateDto.motifRebut);
    }

    await this.validateReferences(updateDto, id);

    const finalGereEnStock = updateDto.gereEnStock ?? materiel.gereEnStock;

    if (
      finalGereEnStock === true &&
      updateDto.dateDernierInventaire !== undefined
    ) {
      throw new BadRequestException(
        "Le dernier inventaire d'un matériel géré en stock doit être modifié depuis le module stock.",
      );
    }

    if (updateDto.dateMiseService !== undefined) {
      data.dateMiseService = this.parseOptionalDate(updateDto.dateMiseService);
    }

    if (updateDto.dateDernierInventaire !== undefined) {
      data.dateDernierInventaire = this.parseOptionalDate(
        updateDto.dateDernierInventaire,
      );
    }

    if (updateDto.dateRebut !== undefined) {
      data.dateRebut = this.parseOptionalDate(updateDto.dateRebut);
    }

    if (updateDto.motifRebut !== undefined) {
      data.motifRebut = this.normalizeOptionalString(updateDto.motifRebut);
    }

    if (updateDto.gereEnStock !== undefined) {
      data.gereEnStock = updateDto.gereEnStock;
    }

    if (updateDto.positionActuelle !== undefined) {
      data.positionActuelle = this.normalizeOptionalString(
        updateDto.positionActuelle,
      );
    }

    if (updateDto.idModele !== undefined) {
      data.idModele = updateDto.idModele ?? null;
    }

    if (updateDto.idType !== undefined) {
      data.idType = updateDto.idType ?? null;
    }

    if (updateDto.idPointStructure !== undefined) {
      data.idPointStructure = updateDto.idPointStructure ?? null;
    }

    if (updateDto.idMaterielParent !== undefined) {
      data.idMaterielParent = updateDto.idMaterielParent ?? null;
    }

    if (updateDto.idLigneEntreeStock !== undefined) {
      data.idLigneEntreeStock = updateDto.idLigneEntreeStock ?? null;
    }

    if (updateDto.actif !== undefined) {
      data.actif = updateDto.actif;
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel: id,
      },
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async updateCycleVie(id: number, dto: UpdateCycleVieMaterielDto) {
    const materiel = await this.findOne(id);

    if (
      materiel.gereEnStock === true &&
      dto.dateDernierInventaire !== undefined
    ) {
      throw new BadRequestException(
        "Ce matériel est géré en stock. Son dernier inventaire doit être modifié depuis le module stock.",
      );
    }

    const data: any = {};

    if (dto.idEtat !== undefined) {
      if (dto.idEtat === null) {
        throw new BadRequestException("L'état du matériel est obligatoire.");
      }

      const nouvelEtat = await this.findEtatOrFail(dto.idEtat);

      const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
      const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

      this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

      data.idEtat = dto.idEtat;
      this.appliquerEffetsEtat(data, nouveauCodeEtat, dto.motifRebut);
    }

    if (dto.dateMiseService !== undefined) {
      data.dateMiseService = this.parseOptionalDate(dto.dateMiseService);
    }

    if (dto.dateDernierInventaire !== undefined) {
      data.dateDernierInventaire = this.parseOptionalDate(
        dto.dateDernierInventaire,
      );
    }

    if (dto.dateRebut !== undefined) {
      data.dateRebut = this.parseOptionalDate(dto.dateRebut);
    }

    if (dto.motifRebut !== undefined) {
      data.motifRebut = this.normalizeOptionalString(dto.motifRebut);
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel: id,
      },
      data,
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }

  async changerEtatMateriel(id: number, dto: ChangeEtatMaterielDto) {
    if (dto.idEtat === undefined || dto.idEtat === null) {
      throw new BadRequestException("L'état du matériel est obligatoire.");
    }

    const materiel = await this.findOne(id);
    const nouvelEtat = await this.findEtatOrFail(dto.idEtat);

    const ancienCodeEtat = materiel.etat_materiel?.code ?? null;
    const nouveauCodeEtat = this.getCodeEtat(nouvelEtat);

    this.verifierTransitionEtat(ancienCodeEtat, nouveauCodeEtat);

    const data: any = {
      idEtat: dto.idEtat,
    };

    this.appliquerEffetsEtat(data, nouveauCodeEtat, dto.motif);

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel: id,
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
        "Ce matériel ne peut pas être ciblé par une intervention. Il doit être Validé, En panne ou En révision.",
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
    const materiel = await this.findOne(idMateriel);

    if (materiel.gereEnStock !== true) {
      throw new BadRequestException(
        "Ce matériel n'est pas géré en stock. Son inventaire doit être modifié manuellement depuis la fiche matériel.",
      );
    }

    const updatedMateriel = await this.prisma.materiel.update({
      where: {
        idMateriel,
      },
      data: {
        dateDernierInventaire: dateInventaire,
      },
      include: this.includeRelations,
    });

    return this.formatMateriel(updatedMateriel);
  }
async genererPlanPreventifDepuisPPP(
  idMateriel: number,
  idPlanPreventifPredefini: number,
) {
  const materiel = await this.findOne(idMateriel);

  if (!materiel.idModele) {
    throw new BadRequestException(
      'Ce matériel n’a pas de modèle. Impossible de générer un plan préventif prédéfini.',
    );
  }

  const ppp = await this.prisma.plan_preventif_predefini.findFirst({
    where: {
      idPlanPreventifPredefini,
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
      idMateriel,
      idPlanPreventifPredefiniSource: idPlanPreventifPredefini,
    },
  });

  if (existing) {
    throw new BadRequestException(
      'Ce plan préventif a déjà été généré pour ce matériel.',
    );
  }

  const plan = await this.prisma.plan_preventif.create({
    data: {
      code: `PP-${materiel.code || idMateriel}-${ppp.code}`,
      libelle: ppp.titre || ppp.code,
      etat: ppp.etat || 'ACTIF',
      typeDeclenchement: ppp.typeDeclenchement,
      organisation: ppp.organisation,
      idMateriel,
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
        idMateriel,
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

  return this.findOne(idMateriel);
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
    await this.findOne(id);

    return this.prisma.materiel.delete({
      where: {
        idMateriel: id,
      },
    });
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
    const etat = await this.prisma.etat_materiel.findUnique({
      where: {
        idEtat,
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
        ...(currentId && {
          NOT: {
            idMateriel: currentId,
          },
        }),
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
        ...(currentId && {
          NOT: {
            idMateriel: currentId,
          },
        }),
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

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined || value === null) return null;

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeRequiredString(value: string | null | undefined, message: string) {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }

  private parseOptionalDate(value?: string | Date | null) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }

    return date;
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
  async restore(id: number) {
  const materiel = await this.prisma.materiel.findUnique({
    where: { idMateriel: id },
  });

  if (!materiel) {
    throw new NotFoundException(`Matériel ${id} introuvable.`);
  }

  return this.prisma.materiel.update({
    where: { idMateriel: id },
    data: {
      actif: true,
    },
    include: this.includeRelations,
  });
}
}
