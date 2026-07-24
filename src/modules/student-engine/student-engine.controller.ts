import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { StudentEngineService } from './student-engine.service';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('student-engine')
@UseGuards(TenantGuard, JwtAuthGuard, RolesGuard)   
export class StudentEngineController {
  constructor(private readonly studentEngineService: StudentEngineService) {}

  @Get('questions')
  async getQuestions(
    @CurrentTenant() tenantId: string,
    @Query() filters: FilterQuestionsDto,
  ) {
    return this.studentEngineService.getQuestions(tenantId, filters);
  }

  @Post('answer')
  @Roles('STUDENT', 'ADMIN')
  async submitAnswer(
    @CurrentTenant() tenantId: string,
    @Req() req: any,
    @Body() dto: SubmitAnswerDto,
  ) {
    // O ID do usuário autenticado vem injetado pelo JwtAuthGuard (ou fallback local para dev)
    const userId = req.user?.id || 'dev-user-id';
    return this.studentEngineService.submitAnswer(tenantId, userId, dto);
  }

  @Get('performance')
  async getPerformance(@CurrentTenant() tenantId: string, @Req() req: any) {
    const userId = req.user?.id || 'dev-user-id';
    return this.studentEngineService.getStudentPerformance(tenantId, userId);
  }
}