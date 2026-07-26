import { Controller, Get, Post, Body, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
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
    @CurrentTenant() currentTenantId: string,
    @Req() req: any,
    @Body() dto: SubmitAnswerDto,
  ) {
    // Garante a leitura do tenantId do decorator ou do header HTTP
    const tenantId = currentTenantId || (req.headers['x-tenant-id'] as string);
    
    if (!tenantId) {
      throw new BadRequestException('Header x-tenant-id não informado.');
    }

    const userId = req.user?.id || req.user?.sub || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    return this.studentEngineService.submitAnswer(tenantId, userId, dto);
  }

  @Get('performance')
  async getPerformance(@CurrentTenant() tenantId: string, @Req() req: any) {
    const userId = req.user?.id || 'dev-user-id';
    return this.studentEngineService.getStudentPerformance(tenantId, userId);
  }
}