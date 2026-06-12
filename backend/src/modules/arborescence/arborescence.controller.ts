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
import { ArborescenceService, TreeNode } from './arborescence.service';
import { CreateLienArborescenceDto } from './dto/create-lien-arborescence.dto';
import { MoveNodeDto } from './dto/move-node.dto';
import { AffecterMaterielDto } from './dto/affecter-materiel.dto';

@Controller('arborescence')
export class ArborescenceController {
  constructor(private readonly arborescenceService: ArborescenceService) {}

  @Post('affecter-materiel')
  affecterMateriel(@Body() dto: AffecterMaterielDto) {
    return this.arborescenceService.affecterMateriel(dto);
  }

  @Delete('desaffecter-materiel/:idMateriel')
  desaffecterMateriel(
    @Param('idMateriel', ParseIntPipe) idMateriel: number,
    @Query('typeArborescence') typeArborescence?: string,
  ) {
    return this.arborescenceService.desaffecterMateriel(
      idMateriel,
      typeArborescence,
    );
  }

  @Get('materiel/:idMateriel/position')
  positionMateriel(@Param('idMateriel', ParseIntPipe) idMateriel: number) {
    return this.arborescenceService.positionMateriel(idMateriel);
  }
  @Post('liens')
  createLien(@Body() dto: CreateLienArborescenceDto) {
    return this.arborescenceService.createLien(dto);
  }

  @Delete('liens/:id')
  deleteLien(@Param('id', ParseIntPipe) id: number) {
    return this.arborescenceService.deleteLien(id);
  }

  @Patch('move')
  moveNode(@Body() dto: MoveNodeDto) {
    return this.arborescenceService.moveNode(dto);
  }

  @Get('geographique/tree')
  getGeographiqueTree(): Promise<TreeNode[]> {
    return this.arborescenceService.getGeographiqueTree();
  }

  @Get('technique/tree')
  getTechniqueTree(): Promise<TreeNode[]> {
    return this.arborescenceService.getTechniqueTree();
  }
  @Get('familles/tree')
getFamillesTree() {
  return this.arborescenceService.getFamillesTree();
}

  @Get('materiel/tree')
  getMaterielTree(): Promise<TreeNode[]> {
    return this.arborescenceService.getMaterielTree();
  }
  
}