import { 
  IsString, 
  IsEnum, 
  IsBoolean, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  ArrayMinSize,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class CreateAlternativeDto {
  @IsString()
  letter: string;

  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  statement: string;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsBoolean()
  @IsOptional()
  isTrick?: boolean;

  @IsString()
  source: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsUUID()
  @IsOptional()
  topicId?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateAlternativeDto)
  alternatives: CreateAlternativeDto[];
}