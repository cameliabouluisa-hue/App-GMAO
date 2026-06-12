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
import { ModeleService } from './modele.service';
import { CreateModeleDto } from './dto/create-modele.dto';
import { UpdateModeleDto } from './dto/update-modele.dto';

@Controller('modeles')
export class ModeleController {
  constructor(private readonly modeleService: ModeleService) {}

  @Get()
  findAll() {
    return this.modeleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modeleService.findOne(id);
  }

  @Post()
  create(@Body() createModeleDto: CreateModeleDto) {
    return this.modeleService.create(createModeleDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModeleDto: UpdateModeleDto,
  ) {
    return this.modeleService.update(id, updateModeleDto);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.modeleService.restore(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modeleService.remove(id);
  }
}
