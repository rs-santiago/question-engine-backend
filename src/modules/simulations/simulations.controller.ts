import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { AutoSaveAnswerDto } from './dto/auto-save-answer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('simulations')
@UseGuards(TenantGuard, JwtAuthGuard, RolesGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  // Criar Simulado (Professor/Admin)
  @Post()
  @Roles('TEACHER', 'ADMIN', 'OWNER')
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateSimulationDto,
  ) {
    return this.simulationsService.createSimulation(tenantId, dto);
  }

  // Listar Simulados Disponíveis para o Aluno
  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.simulationsService.findAllByTenant(tenantId);
  }

  // Obter Simulado com Questões para Resolver
  @Get(':id/start')
  async startSimulation(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.simulationsService.startSimulation(tenantId, userId, id);
  }

  // Auto-Save de cada resposta clicada pelo aluno
  @Post('auto-save')
  async autoSaveAnswer(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: AutoSaveAnswerDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.simulationsService.autoSaveAnswer(tenantId, userId, dto);
  }

  // Encerrar / Finalizar Simulado
  @Post(':id/finish')
  async finishSimulation(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.simulationsService.finishSimulation(tenantId, userId, id);
  }
}