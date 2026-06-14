import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';

import { CreateDemandeInterventionDto } from './dto/create-demande-intervention.dto';
import { UpdateDemandeInterventionDto } from './dto/update-demande-intervention.dto';

import {
  ActionDemandeInterventionDto,
  RefuserDemandeInterventionDto,
  RefuserTravauxDemandeDto,
} from './dto/action-demande-intervention.dto';

import { DEMANDE_INTERVENTION_STATUTS } from './demande-intervention.constants';

type FindAllDemandeFilters = {
  statut?: string;
  idMateriel?: number;
  priorite?: string;
};

const demandeInclude = {
  materiel: true,
  intervention: {
    orderBy: {
      idIntervention: 'desc',
    },
  },
  historiquesEtat: {
    orderBy: {
      changedAt: 'desc',
    },
  },
} satisfies Prisma.demande_interventionInclude;

@Injectable()
export class DemandeInterventionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FindAllDemandeFilters = {}) {
    const where: Prisma.demande_interventionWhereInput = {};

    if (filters.statut) where.statut = filters.statut;
    if (filters.idMateriel) where.idMateriel = filters.idMateriel;
    if (filters.priorite) where.priorite = filters.priorite;

    return this.prisma.demande_intervention.findMany({
      where,
      include: demandeInclude,
      orderBy: {
        idDemande: 'desc',
      },
    });
  }

  async findOne(idDemande: number) {
    const demande = await this.prisma.demande_intervention.findUnique({
      where: { idDemande },
      include: demandeInclude,
    });

    if (!demande) {
      throw new NotFoundException('Demande d’intervention introuvable.');
    }

    return demande;
  }

  async create(dto: CreateDemandeInterventionDto) {
    if (dto.idMateriel) {
      await this.ensureMaterielExists(dto.idMateriel);
    }

    const code = dto.code ?? (await this.generateDemandeCode());

    return this.prisma.$transaction(async (tx) => {
      const demande = await tx.demande_intervention.create({
        data: {
          code,
          dateDemande: this.parseDate(dto.dateDemande) ?? new Date(),
          description: dto.description,
          statut: DEMANDE_INTERVENTION_STATUTS.EN_PREPARATION,

          priorite: dto.priorite ?? 'NORMALE',
          criticite: dto.criticite ?? 'MOYENNE',

          createdBy: dto.createdBy,
          demandeur: dto.demandeur,

          receptionTravaux: dto.receptionTravaux ?? false,
          materielEnPanne: dto.materielEnPanne ?? false,
          materielIndisponible: dto.materielIndisponible ?? false,

          materiel: dto.idMateriel
            ? { connect: { idMateriel: dto.idMateriel } }
            : undefined,
        },
      });

      await this.createHistoriqueEtatTx(tx, {
        idDemande: demande.idDemande,
        ancienStatut: null,
        nouveauStatut: DEMANDE_INTERVENTION_STATUTS.EN_PREPARATION,
        action: 'CREATION',
        commentaire: 'Création de la demande d’intervention',
        changedBy: dto.createdBy,
      });

      return tx.demande_intervention.findUnique({
        where: { idDemande: demande.idDemande },
        include: demandeInclude,
      });
    });
  }

  async update(idDemande: number, dto: UpdateDemandeInterventionDto) {
    const demande = await this.findOne(idDemande);

    this.ensureModifiable(demande.statut);

    if (dto.idMateriel) {
      await this.ensureMaterielExists(dto.idMateriel);
    }

    return this.prisma.demande_intervention.update({
      where: { idDemande },
      data: {
        code: dto.code,
        dateDemande: this.parseDate(dto.dateDemande),
        description: dto.description,
        idMateriel: dto.idMateriel,
        priorite: dto.priorite,
        criticite: dto.criticite,
        demandeur: dto.demandeur,
        receptionTravaux: dto.receptionTravaux,
        materielEnPanne: dto.materielEnPanne,
        materielIndisponible: dto.materielIndisponible,
      },
      include: demandeInclude,
    });
  }

  async delete(idDemande: number) {
    const demande = await this.findOne(idDemande);

    if (demande.statut !== DEMANDE_INTERVENTION_STATUTS.EN_PREPARATION) {
      throw new BadRequestException(
        'Suppression impossible. Seules les DI en préparation peuvent être supprimées.',
      );
    }

    return this.prisma.demande_intervention.delete({
      where: { idDemande },
    });
  }

  async soumettre(idDemande: number, dto: ActionDemandeInterventionDto) {
    return this.changeStatut(idDemande, {
      nouveauStatut: DEMANDE_INTERVENTION_STATUTS.ATTENTE_PRISE_EN_COMPTE,
      action: 'SOUMISSION',
      changedBy: dto.utilisateur,
      commentaire: dto.commentaire,
      allowedFrom: [DEMANDE_INTERVENTION_STATUTS.EN_PREPARATION],
      data: {
        dateSoumission: new Date(),
      },
    });
  }

  async refuser(idDemande: number, dto: RefuserDemandeInterventionDto) {
    return this.changeStatut(idDemande, {
      nouveauStatut: DEMANDE_INTERVENTION_STATUTS.REFUSE,
      action: 'REFUS',
      changedBy: dto.utilisateur,
      commentaire: dto.motifRefus,
      allowedFrom: [DEMANDE_INTERVENTION_STATUTS.ATTENTE_PRISE_EN_COMPTE],
      data: {
        motifRefus: dto.motifRefus,
        validatedBy: dto.utilisateur,
        dateValidation: new Date(),
      },
    });
  }

  async accepter(idDemande: number, dto: ActionDemandeInterventionDto) {
    const demande = await this.findOne(idDemande);

    if (
      demande.statut !==
      DEMANDE_INTERVENTION_STATUTS.ATTENTE_PRISE_EN_COMPTE
    ) {
      throw new BadRequestException(
        `Acceptation impossible depuis le statut ${demande.statut}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const codeIntervention = await this.generateInterventionCodeTx(tx);

      const intervention = await tx.intervention.create({
        data: {
          code: codeIntervention,

          libelle: demande.description
            ? demande.description.slice(0, 150)
            : `OT correctif lié à ${demande.code ?? `DI-${demande.idDemande}`}`,

          description: demande.description,

          typeMaintenance: 'CORRECTIF',
          typeIntervention: 'TRAVAUX',
          natureIntervention: 'CURATIF',

          priorite: demande.priorite ?? 'NORMALE',
          criticite: demande.criticite ?? 'MOYENNE',

          etat: 'EN_PREPARATION',
          origineGeneration: 'DI',

          receptionTravaux: demande.receptionTravaux ?? false,
          materielEnPanne: demande.materielEnPanne ?? false,
          materielIndisponible: demande.materielIndisponible ?? false,
          arretMateriel: demande.materielIndisponible ?? false,

          createdBy: dto.utilisateur,

          demande_intervention: {
            connect: {
              idDemande: demande.idDemande,
            },
          },

          materiel: demande.idMateriel
            ? {
                connect: {
                  idMateriel: demande.idMateriel,
                },
              }
            : undefined,
        },
      });

      await tx.historique_etat_intervention.create({
        data: {
          idIntervention: intervention.idIntervention,
          ancienEtat: null,
          nouvelEtat: 'EN_PREPARATION',
          action: 'CREATION_DEPUIS_DI',
          commentaire: `Création de l’OT depuis la DI ${
            demande.code ?? demande.idDemande
          }`,
          changedBy: dto.utilisateur,
          changedAt: new Date(),
        },
      });

      await tx.demande_intervention.update({
        where: { idDemande },
        data: {
          statut: DEMANDE_INTERVENTION_STATUTS.ATTENTE_REALISATION,
          validatedBy: dto.utilisateur,
          dateValidation: new Date(),
        },
      });

      await this.createHistoriqueEtatTx(tx, {
        idDemande,
        ancienStatut: demande.statut,
        nouveauStatut: DEMANDE_INTERVENTION_STATUTS.ATTENTE_REALISATION,
        action: 'ACCEPTATION',
        commentaire:
          dto.commentaire ??
          `DI acceptée, OT ${intervention.code} créé automatiquement.`,
        changedBy: dto.utilisateur,
      });

      const demandeUpdated = await tx.demande_intervention.findUnique({
        where: { idDemande },
        include: demandeInclude,
      });

      return {
        demande: demandeUpdated,
        interventionCreee: intervention,
      };
    });
  }

  async accepterTravaux(idDemande: number, dto: ActionDemandeInterventionDto) {
    return this.changeStatut(idDemande, {
      nouveauStatut: DEMANDE_INTERVENTION_STATUTS.SOLDE,
      action: 'ACCEPTER_TRAVAUX',
      changedBy: dto.utilisateur,
      commentaire: dto.commentaire,
      allowedFrom: [DEMANDE_INTERVENTION_STATUTS.TERMINE],
      data: {
        receptionBy: dto.utilisateur,
        dateReceptionTravaux: new Date(),
      },
    });
  }

  async refuserTravaux(idDemande: number, dto: RefuserTravauxDemandeDto) {
    return this.changeStatut(idDemande, {
      nouveauStatut: DEMANDE_INTERVENTION_STATUTS.ATTENTE_REALISATION,
      action: 'REFUSER_TRAVAUX',
      changedBy: dto.utilisateur,
      commentaire: dto.motifRefusTravaux,
      allowedFrom: [DEMANDE_INTERVENTION_STATUTS.TERMINE],
      data: {
        motifRefusTravaux: dto.motifRefusTravaux,
      },
    });
  }

  private async changeStatut(
    idDemande: number,
    params: {
      nouveauStatut: string;
      action: string;
      changedBy?: string;
      commentaire?: string;
      allowedFrom: string[];
      data: Prisma.demande_interventionUpdateInput;
    },
  ) {
    const demande = await this.findOne(idDemande);
    const ancienStatut = demande.statut;

    if (!ancienStatut || !params.allowedFrom.includes(ancienStatut)) {
      throw new BadRequestException(
        `Transition impossible : ${ancienStatut} → ${params.nouveauStatut}`,
      );
    }

    if (
      ancienStatut === DEMANDE_INTERVENTION_STATUTS.SOLDE ||
      ancienStatut === DEMANDE_INTERVENTION_STATUTS.REFUSE ||
      ancienStatut === DEMANDE_INTERVENTION_STATUTS.ANNULE
    ) {
      throw new BadRequestException(
        'Cette DI est soldée, refusée ou annulée. Modification impossible.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.demande_intervention.update({
        where: { idDemande },
        data: {
          ...params.data,
          statut: params.nouveauStatut,
        },
      });

      await this.createHistoriqueEtatTx(tx, {
        idDemande,
        ancienStatut,
        nouveauStatut: params.nouveauStatut,
        action: params.action,
        commentaire: params.commentaire,
        changedBy: params.changedBy,
      });

      return tx.demande_intervention.findUnique({
        where: { idDemande: updated.idDemande },
        include: demandeInclude,
      });
    });
  }

  private async createHistoriqueEtatTx(
    tx: Prisma.TransactionClient,
    data: {
      idDemande: number;
      ancienStatut?: string | null;
      nouveauStatut: string;
      action?: string;
      commentaire?: string;
      changedBy?: string;
    },
  ) {
    return tx.historique_etat_demande_intervention.create({
      data: {
        idDemande: data.idDemande,
        ancienStatut: data.ancienStatut,
        nouveauStatut: data.nouveauStatut,
        action: data.action,
        commentaire: data.commentaire,
        changedBy: data.changedBy,
        changedAt: new Date(),
      },
    });
  }

  private ensureModifiable(statut?: string | null) {
    if (
      statut === DEMANDE_INTERVENTION_STATUTS.SOLDE ||
      statut === DEMANDE_INTERVENTION_STATUTS.REFUSE ||
      statut === DEMANDE_INTERVENTION_STATUTS.ANNULE
    ) {
      throw new BadRequestException(
        'Cette DI est soldée, refusée ou annulée. Modification impossible.',
      );
    }
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Date invalide : ${value}`);
    }

    return date;
  }

  private async ensureMaterielExists(idMateriel: number) {
    const materiel = await this.prisma.materiel.findUnique({
      where: { idMateriel },
    });

    if (!materiel) {
      throw new NotFoundException('Matériel introuvable.');
    }
  }

  private async generateDemandeCode() {
    const count = await this.prisma.demande_intervention.count();
    let index = count + 1;

    while (true) {
      const code = `DI-${String(index).padStart(6, '0')}`;

      const exists = await this.prisma.demande_intervention.findFirst({
        where: { code },
      });

      if (!exists) return code;

      index++;
    }
  }

  private async generateInterventionCodeTx(tx: Prisma.TransactionClient) {
    const count = await tx.intervention.count();
    let index = count + 1;

    while (true) {
      const code = `OT-COR-${String(index).padStart(6, '0')}`;

      const exists = await tx.intervention.findFirst({
        where: { code },
      });

      if (!exists) return code;

      index++;
    }
  }
}