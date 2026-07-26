import { IsNotEmpty, IsString, IsInt, IsArray, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateSimulationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(5)
  durationMinutes: number; // Ex: 180 minutos (3 horas)

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsArray()
  @IsString({ each: true })
  questionIds: string[]; // IDs das questões selecionadas do acervo
}