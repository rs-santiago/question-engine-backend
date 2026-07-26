import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { QuestionsAdminService, CreateQuestionDto } from './questions-admin.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // <--- Garante a validação do Token e injeta req.user
@Controller('admin/questions')
export class QuestionsAdminController {
  constructor(private readonly questionsAdminService: QuestionsAdminService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.questionsAdminService.findAllByTenant(tenantId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateQuestionDto) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.questionsAdminService.createQuestion(tenantId, dto);
  }

  @Post('upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPdf(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('sourceName') sourceName: string,
    @Body('topicId') topicId?: string,
  ) {
    // Tenta obter o tenantId do Token JWT ou do Header x-tenant-id enviado pelo frontend
    const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string);

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não identificado na requisição.');
    }

    return this.questionsAdminService.enqueuePdfProcessing(
      tenantId,
      file,
      sourceName,
      topicId,
    );
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.questionsAdminService.deleteQuestion(tenantId, id);
  }

  // Adicione este GET no QuestionsAdminController:
  @Get('job-status/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.questionsAdminService.getJobStatus(id);
  }
}