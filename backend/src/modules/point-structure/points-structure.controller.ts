// backend/src/modules/points-structure/points-structure.controller.ts

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

import { PointsStructureService } from './points-structure.service';
import { CreatePointStructureDto } from './dto/create-points-structure.dto';
import { UpdatePointStructureDto } from './dto/update-points-structure.dto';
import { FindPointStructureQueryDto } from './dto/find-points-structure-query.dto';

@Controller('points-structure')
export class PointsStructureController {
  constructor(
    private readonly pointsStructureService: PointsStructureService,
  ) {}

  @Get()
  findAll(@Query() query: FindPointStructureQueryDto) {
    return this.pointsStructureService.findAll(query);
  }

  @Get(':idPoint')
  findOne(@Param('idPoint', ParseIntPipe) idPoint: number) {
    return this.pointsStructureService.findOne(idPoint);
  }

  @Post()
  create(@Body() dto: CreatePointStructureDto) {
    return this.pointsStructureService.create(dto);
  }

  @Patch(':idPoint')
  update(
    @Param('idPoint', ParseIntPipe) idPoint: number,
    @Body() dto: UpdatePointStructureDto,
  ) {
    return this.pointsStructureService.update(idPoint, dto);
  }

  @Delete(':idPoint')
  remove(@Param('idPoint', ParseIntPipe) idPoint: number) {
    return this.pointsStructureService.remove(idPoint);
  }

  @Patch(':idPoint/restaurer')
  restaurer(@Param('idPoint', ParseIntPipe) idPoint: number) {
    return this.pointsStructureService.restore(idPoint);
  }

  @Delete(':idPoint/definitif')
  deleteDefinitif(@Param('idPoint', ParseIntPipe) idPoint: number) {
    return this.pointsStructureService.deleteDefinitif(idPoint);
  }
}