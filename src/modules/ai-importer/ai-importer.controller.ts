import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateImportJobDto } from './dto/create-import-job.dto';

@Controller('ai-importer')
@UseGuards(TenantGuard)
export class AiImporterController {
  constructor(@InjectQueue('ai-importer-queue') private readonly importQueue: Queue) {}

  @Post('enqueue')
  async enqueueImport(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateImportJobDto,
  ) {
    const job = await this.importQueue.add('process-pdf-import', {
      tenantId,
      topicId: dto.topicId,
      fileUrl: dto.fileUrl,
    });

    return {
      message: 'Job de importação enviado para a fila de processamento em background.',
      jobId: job.id,
    };
  }
}