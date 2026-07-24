import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuestionsAdminController } from './questions-admin.controller';
import { QuestionsAdminService } from './questions-admin.service';
import { IngestionProcessor } from '../../jobs/ingestion.processor';
import { GeminiService } from '../ai-parser/gemini.service';
import { AiParserModule } from '@modules/ai-parser/ai-parser.module';

@Module({
  imports: [
    AiParserModule,
    BullModule.registerQueue({
      name: 'ingestion-queue',
    }),
  ],
  controllers: [QuestionsAdminController],
  providers: [
    QuestionsAdminService,
    IngestionProcessor
  ],
  exports: [QuestionsAdminService],
})
export class QuestionsAdminModule {}