import { Module } from '@nestjs/common';
import { QuestionsAdminController } from './questions-admin.controller';
import { QuestionsAdminService } from './questions-admin.service';

@Module({
  controllers: [QuestionsAdminController],
  providers: [QuestionsAdminService],
  exports: [QuestionsAdminService],
})
export class QuestionsAdminModule {}