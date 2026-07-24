import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateImportJobDto {
  @IsUUID()
  topicId: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsEnum(Difficulty)
  defaultDifficulty?: Difficulty = Difficulty.MEDIUM;
}