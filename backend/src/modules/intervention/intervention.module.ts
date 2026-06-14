import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { InterventionConsommationService } from './intervention-consommation.service';
import { InterventionController } from './intervention.controller';
import { InterventionService } from './intervention.service';

@Module({
  imports: [PrismaModule],
  controllers: [InterventionController],
  providers: [InterventionService, InterventionConsommationService],
  exports: [InterventionService, InterventionConsommationService],
})
export class InterventionModule {}