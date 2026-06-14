import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { AnnulerConsommationInterventionDto } from './dto/annuler-consommation-intervention.dto';
import {
  AffecterEquipeDto,
  AffecterTechnicienDto,
  ChangementEtatDto,
  DemarrerInterventionDto,
  RefuserTravauxDto,
  ReporterInterventionDto,
  TerminerInterventionDto,
} from './dto/action-intervention.dto';
import { CreateConsommationInterventionDto } from './dto/create-consommation-intervention.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { CreateOccupationInterventionDto } from './dto/create-occupation-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { UpsertCompteRenduInterventionDto } from './dto/upsert-compte-rendu-intervention.dto';

import { InterventionConsommationService } from './intervention-consommation.service';
import { InterventionService } from './intervention.service';

@Controller('interventions')
export class InterventionController {
  constructor(
    private readonly service: InterventionService,
    private readonly consommationService: InterventionConsommationService,
  ) {}

  /* =========================
     DASHBOARDS
  ========================= */

  @Get('dashboard/responsable')
  dashboardResponsable() {
    return this.service.dashboardResponsable();
  }

  @Get('dashboard/equipe/:idEquipe')
  dashboardEquipe(@Param('idEquipe', ParseIntPipe) idEquipe: number) {
    return this.service.dashboardEquipe(idEquipe);
  }

  @Get('dashboard/technicien/:idTechnicien')
  dashboardTechnicien(
    @Param('idTechnicien', ParseIntPipe) idTechnicien: number,
  ) {
    return this.service.dashboardTechnicien(idTechnicien);
  }

  @Get('dashboard/chef-equipe/:idEquipe')
  dashboardChefEquipe(@Param('idEquipe', ParseIntPipe) idEquipe: number) {
    return this.service.dashboardChefEquipe(idEquipe);
  }

  /* =========================
     FILTRES
  ========================= */

  @Get('type/:typeMaintenance')
  findByType(@Param('typeMaintenance') typeMaintenance: string) {
    return this.service.findByType(typeMaintenance);
  }

  @Get('etat/:etat')
  findByEtat(@Param('etat') etat: string) {
    return this.service.findByEtat(etat);
  }

  /* =========================
     CONSOMMATIONS ARTICLES
  ========================= */

  @Get(':id/consommations')
  getConsommations(@Param('id', ParseIntPipe) idIntervention: number) {
    return this.consommationService.getConsommations(idIntervention);
  }

  @Post(':id/consommations')
  createConsommation(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: CreateConsommationInterventionDto,
  ) {
    return this.consommationService.createConsommation(idIntervention, dto);
  }

  @Patch(':id/consommations/:idConsommation/annuler')
  annulerConsommation(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Param('idConsommation', ParseIntPipe) idConsommation: number,
    @Body() dto: AnnulerConsommationInterventionDto,
  ) {
    return this.consommationService.annulerConsommation(
      idIntervention,
      idConsommation,
      dto,
    );
  }

  /* =========================
     LISTE / CRUD
  ========================= */

  @Get()
  findAll(
    @Query('etat') etat?: string,
    @Query('typeMaintenance') typeMaintenance?: string,
    @Query('idMateriel') idMateriel?: string,
    @Query('idEquipe') idEquipe?: string,
  ) {
    return this.service.findAll({
      etat,
      typeMaintenance,
      idMateriel: idMateriel ? Number(idMateriel) : undefined,
      idEquipe: idEquipe ? Number(idEquipe) : undefined,
    });
  }

  /* =========================
     OCCUPATIONS
  ========================= */

  @Get(':id/occupations')
  getOccupations(@Param('id', ParseIntPipe) idIntervention: number) {
    return this.service.getOccupations(idIntervention);
  }

  @Post(':id/occupations')
  createOccupation(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: CreateOccupationInterventionDto,
  ) {
    return this.service.createOccupation(idIntervention, dto);
  }

  @Delete(':id/occupations/:idOccupation')
  deleteOccupation(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Param('idOccupation', ParseIntPipe) idOccupation: number,
  ) {
    return this.service.deleteOccupation(idIntervention, idOccupation);
  }

  /* =========================
     COMPTE RENDU
  ========================= */

  @Get(':id/compte-rendu')
  getCompteRendu(@Param('id', ParseIntPipe) idIntervention: number) {
    return this.service.getCompteRendu(idIntervention);
  }

  @Post(':id/compte-rendu')
  upsertCompteRendu(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: UpsertCompteRenduInterventionDto,
  ) {
    return this.service.upsertCompteRendu(idIntervention, dto);
  }

  @Patch(':id/compte-rendu')
  updateCompteRendu(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: UpsertCompteRenduInterventionDto,
  ) {
    return this.service.upsertCompteRendu(idIntervention, dto);
  }

  /* =========================
     CRUD INTERVENTION
  ========================= */

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) idIntervention: number) {
    return this.service.findOne(idIntervention);
  }

  @Post()
  create(@Body() dto: CreateInterventionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: UpdateInterventionDto,
  ) {
    return this.service.update(idIntervention, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) idIntervention: number) {
    return this.service.delete(idIntervention);
  }

  /* =========================
     AFFECTATIONS
  ========================= */

  @Patch(':id/affecter-equipe')
  affecterEquipe(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: AffecterEquipeDto,
  ) {
    return this.service.affecterEquipe(idIntervention, dto);
  }

  @Post(':id/affectations')
  affecterTechnicien(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: AffecterTechnicienDto,
  ) {
    return this.service.affecterTechnicien(idIntervention, dto);
  }

  @Delete('affectations/:id')
  retirerAffectation(@Param('id', ParseIntPipe) idAffectation: number) {
    return this.service.retirerAffectation(idAffectation);
  }

  /* =========================
     WORKFLOW INTERVENTION
  ========================= */

  @Post(':id/demander-validation')
  demanderValidation(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.demanderValidation(idIntervention, dto);
  }

  @Post(':id/valider')
  valider(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.valider(idIntervention, dto);
  }

  @Post(':id/demarrer')
  demarrer(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: DemarrerInterventionDto,
  ) {
    return this.service.demarrer(idIntervention, dto);
  }

  @Post(':id/terminer')
  terminer(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: TerminerInterventionDto,
  ) {
    return this.service.terminer(idIntervention, dto);
  }

  @Post(':id/accepter-travaux')
  accepterTravaux(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.accepterTravaux(idIntervention, dto);
  }

  @Post(':id/refuser-travaux')
  refuserTravaux(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: RefuserTravauxDto,
  ) {
    return this.service.refuserTravaux(idIntervention, dto);
  }

  @Post(':id/solder')
  solder(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.solder(idIntervention, dto);
  }

  @Post(':id/annuler')
  annuler(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.annuler(idIntervention, dto);
  }

  @Post(':id/archiver')
  archiver(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ChangementEtatDto,
  ) {
    return this.service.archiver(idIntervention, dto);
  }

  @Post(':id/reporter')
  reporter(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: ReporterInterventionDto,
  ) {
    return this.service.reporter(idIntervention, dto);
  }

  /* =========================
     COMPATIBILITÉ ANCIEN FRONTEND
  ========================= */

  @Patch(':id/realiser')
  realiser(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body() dto: TerminerInterventionDto,
  ) {
    return this.service.terminer(idIntervention, dto);
  }

  @Patch(':id/cloturer')
  cloturer(
    @Param('id', ParseIntPipe) idIntervention: number,
    @Body('closedBy') closedBy?: string,
  ) {
    return this.service.solder(idIntervention, {
      utilisateur: closedBy,
      commentaire: 'Clôture depuis ancienne route',
    });
  }
}
