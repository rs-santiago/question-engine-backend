import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { QuestionsAdminService } from './questions-admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/questions')
@UseGuards(TenantGuard, JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'OWNER', 'TEACHER') // Restrito apenas a Professores e Administradores
export class QuestionsAdminController {
  constructor(private readonly questionsAdminService: QuestionsAdminService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateQuestionDto) {
    return this.questionsAdminService.create(req.user.tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.questionsAdminService.findAll(req.user.tenantId);
  }
}