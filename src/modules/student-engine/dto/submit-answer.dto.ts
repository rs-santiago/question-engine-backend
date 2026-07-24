import { IsUUID, IsInt, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  @IsUUID()
  alternativeId: string;

  @IsInt()
  @Min(1)
  timeSpentInSeconds: number;
}