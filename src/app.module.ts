import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AiImporterModule } from './modules/ai-importer/ai-importer.module';
import { StudentEngineModule } from './modules/student-engine/student-engine.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionsAdminModule } from '@modules/questions-admin/questions-admin.module';
import { SimulationsModule } from '@modules/simulations/simulations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6380),
        },
      }),
      inject: [ConfigService],
    }),
    AiImporterModule,
    StudentEngineModule,
    WebhooksModule,
    AuthModule,
    QuestionsAdminModule,
    SimulationsModule
  ],
})
export class AppModule {}