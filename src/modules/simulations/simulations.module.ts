import { Module } from '@nestjs/common';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { PrismaModule } from '../../prisma/prisma.module'; // Ajuste o caminho do seu PrismaModule

@Module({
  imports: [PrismaModule],
  controllers: [SimulationsController],
  providers: [SimulationsService],
  exports: [SimulationsService],
})
export class SimulationsModule {}