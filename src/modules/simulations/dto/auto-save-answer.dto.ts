import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class AutoSaveAnswerDto {
  @IsNotEmpty()
  @IsString()
  simulationId: string;

  @IsNotEmpty()
  @IsString()
  questionId: string;

  @IsNotEmpty()
  @IsString()
  alternativeId: string;

  @IsInt()
  @Min(0)
  timeSpentInSeconds: number;
}