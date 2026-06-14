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

import { DemandeInterventionService } from './demande-intervention.service';

import { CreateDemandeInterventionDto } from './dto/create-demande-intervention.dto';
import { UpdateDemandeInterventionDto } from './dto/update-demande-intervention.dto';

import {
  ActionDemandeInterventionDto,
  RefuserDemandeInterventionDto,
  RefuserTravauxDemandeDto,
} from './dto/action-demande-intervention.dto';

@Controller('demandes-intervention')
export class DemandeInterventionController {
  constructor(private readonly service: DemandeInterventionService) {}

  @Get()
  findAll(
    @Query('statut') statut?: string,
    @Query('idMateriel') idMateriel?: string,
    @Query('priorite') priorite?: string,
  ) {
    return this.service.findAll({
      statut,
      priorite,
      idMateriel: idMateriel ? Number(idMateriel) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateDemandeInterventionDto) {
    return this.service.create(dto);
  }

  @Post(':id/soumettre')
  soumettre(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: ActionDemandeInterventionDto,
  ) {
    return this.service.soumettre(idDemande, dto);
  }

  @Post(':id/accepter')
  accepter(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: ActionDemandeInterventionDto,
  ) {
    return this.service.accepter(idDemande, dto);
  }

  @Post(':id/refuser')
  refuser(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: RefuserDemandeInterventionDto,
  ) {
    return this.service.refuser(idDemande, dto);
  }

  @Post(':id/accepter-travaux')
  accepterTravaux(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: ActionDemandeInterventionDto,
  ) {
    return this.service.accepterTravaux(idDemande, dto);
  }

  @Post(':id/refuser-travaux')
  refuserTravaux(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: RefuserTravauxDemandeDto,
  ) {
    return this.service.refuserTravaux(idDemande, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) idDemande: number) {
    return this.service.findOne(idDemande);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) idDemande: number,
    @Body() dto: UpdateDemandeInterventionDto,
  ) {
    return this.service.update(idDemande, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) idDemande: number) {
    return this.service.delete(idDemande);
  }
}