import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiImporterController } from './ai-importer.controller';
import { AiImporterProcessor } from './processors/ai-importer.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-importer-queue',
    }),
  ],
  controllers: [AiImporterController],
  providers: [AiImporterProcessor],
})
export class AiImporterModule {}