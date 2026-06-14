import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGammeDto } from './dto/create-gamme.dto';
import { UpdateGammeDto } from './dto/update-gamme.dto';
import { CreateGammeOperationDto } from './dto/create-gamme-operation.dto';
import { UpdateGammeOperationDto } from './dto/update-gamme-operation.dto';

@Injectable()
export class GammeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGammeDto: CreateGammeDto) {
    return this.prisma.gamme.create({
      data: createGammeDto,
      include: {
        modele: true,
        gamme_operation: true,
      },
    });
  }

  async findAll() {
    return this.prisma.gamme.findMany({
      include: {
        modele: true,
        gamme_operation: {
          orderBy: { ordre: 'asc' },
        },
      },
      orderBy: {
        idGamme: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const gamme = await this.prisma.gamme.findUnique({
      where: { idGamme: id },
      include: {
        modele: true,
        gamme_operation: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    if (!gamme) {
      throw new NotFoundException(`Gamme ${id} introuvable`);
    }

    return gamme;
  }

  async update(id: number, updateGammeDto: UpdateGammeDto) {
    await this.ensureGammeExists(id);

    return this.prisma.gamme.update({
      where: { idGamme: id },
      data: updateGammeDto,
      include: {
        modele: true,
        gamme_operation: {
          orderBy: { ordre: 'asc' },
        },
      },
    });
  }

  async remove(id: number) {
    await this.ensureGammeExists(id);

    return this.prisma.gamme.delete({
      where: { idGamme: id },
    });
  }

  async createOperation(
    idGamme: number,
    createGammeOperationDto: CreateGammeOperationDto,
  ) {
    await this.ensureGammeExists(idGamme);

    return this.prisma.gamme_operation.create({
      data: {
        ...createGammeOperationDto,
        idGamme,
      },
      include: {
        gamme: true,
        point_structure: true,
        materiel: true,
        modele: true,
        
      },
    });
  }

  async findOperationsByGamme(idGamme: number) {
    await this.ensureGammeExists(idGamme);

    return this.prisma.gamme_operation.findMany({
      where: { idGamme },
      include: {
        point_structure: true,
        materiel: true,
        modele: true,
        
      },
      orderBy: {
        ordre: 'asc',
      },
    });
  }

  async updateOperation(
    idOperation: number,
    updateGammeOperationDto: UpdateGammeOperationDto,
  ) {
    await this.ensureOperationExists(idOperation);

    return this.prisma.gamme_operation.update({
      where: { idOperation },
      data: updateGammeOperationDto,
      include: {
        gamme: true,
        point_structure: true,
        materiel: true,
        modele: true,
        
      },
    });
  }

  async removeOperation(idOperation: number) {
    await this.ensureOperationExists(idOperation);

    return this.prisma.gamme_operation.delete({
      where: { idOperation },
    });
  }

  private async ensureGammeExists(id: number) {
    const gamme = await this.prisma.gamme.findUnique({
      where: { idGamme: id },
      select: { idGamme: true },
    });

    if (!gamme) {
      throw new NotFoundException(`Gamme ${id} introuvable`);
    }
  }

  private async ensureOperationExists(id: number) {
    const operation = await this.prisma.gamme_operation.findUnique({
      where: { idOperation: id },
      select: { idOperation: true },
    });

    if (!operation) {
      throw new NotFoundException(`Opération de gamme ${id} introuvable`);
    }
  }
}