import { Module } from '@nestjs/common';
import { StudentEngineController } from './student-engine.controller';
import { StudentEngineService } from './student-engine.service';

@Module({
  controllers: [StudentEngineController],
  providers: [StudentEngineService],
})
export class StudentEngineModule {}