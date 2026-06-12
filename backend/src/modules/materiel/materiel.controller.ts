import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { MaterielService } from './materiel.service';
import { CreateMaterielDto } from './dto/create-materiel.dto';
import { UpdateMaterielDto } from './dto/update-materiel.dto';
import { ChangeEtatMaterielDto } from './dto/change-etat-materiel.dto';
import { UpdateCycleVieMaterielDto } from './dto/update-cycle-vie-materiel.dto';

@Controller('materiels')
export class MaterielController {
  constructor(private readonly materielService: MaterielService) {}

  @Post()
  create(@Body() createDto: CreateMaterielDto) {
    return this.materielService.create(createDto);
  }

  @Get()
  findAll() {
    return this.materielService.findAll();
  }

  @Get('referentiel/etats')
  findEtatsMateriel() {
    return this.materielService.findEtatsMateriel();
  }

  @Get('referentiel/types')
  findTypesMateriel() {
    return this.materielService.findTypesMateriel();
  }

  @Get(':id/intervention-possible')
  verifierInterventionPossible(@Param('id', ParseIntPipe) id: number) {
    return this.materielService.verifierInterventionPossible(id);
  }

  @Post(':id/generer-plan-preventif/:idPPP')
  genererPlanPreventifDepuisPPP(
    @Param('id', ParseIntPipe) id: number,
    @Param('idPPP', ParseIntPipe) idPPP: number,
  ) {
    return this.materielService.genererPlanPreventifDepuisPPP(id, idPPP);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.materielService.restore(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materielService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMaterielDto,
  ) {
    return this.materielService.update(id, updateDto);
  }

  @Patch(':id/cycle-vie')
  updateCycleVie(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCycleVieMaterielDto,
  ) {
    return this.materielService.updateCycleVie(id, dto);
  }

  @Patch(':id/changer-etat')
  changerEtatMateriel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeEtatMaterielDto,
  ) {
    return this.materielService.changerEtatMateriel(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materielService.remove(id);
  }
}