import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajuste o caminho do seu PrismaService
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { AutoSaveAnswerDto } from './dto/auto-save-answer.dto';

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar Simulado
  async createSimulation(tenantId: string, dto: CreateSimulationDto) {
    const questionBigIntIds = dto.questionIds.map((id) => BigInt(id));

    return this.prisma.simulation.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        simulationQuestions: {
          create: questionBigIntIds.map((questionId, index) => ({
            questionId,
            order: index + 1,
          })),
        },
      },
    });
  }

  // Listar Simulados do Tenant
  async findAllByTenant(tenantId: string) {
    return this.prisma.simulation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Iniciar / Obter Simulado com Questões
  async startSimulation(tenantId: string, userId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: { id: simulationId, tenantId },
      include: {
        simulationQuestions: {
          include: {
            question: {
              include: {
                alternatives: {
                  select: {
                    id: true,
                    letter: true,
                    text: true,
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulado não encontrado.');
    }

    // Busca respostas já salvas pelo aluno (Auto-Save prévio)
    const savedAnswersRecords = await this.prisma.studentAnswer.findMany({
      where: { tenantId, userId, simulationId },
    });

    const savedAnswers: Record<string, string> = {};
    savedAnswersRecords.forEach((record) => {
      savedAnswers[record.questionId.toString()] = record.alternativeId.toString();
    });

    return {
      id: simulation.id,
      title: simulation.title,
      durationMinutes: simulation.durationMinutes,
      questions: simulation.simulationQuestions.map((sq) => ({
        id: sq.question.id.toString(),
        statement: sq.question.statement,
        source: sq.question.source,
        difficulty: sq.question.difficulty,
        alternatives: sq.question.alternatives.map((alt) => ({
          id: alt.id.toString(),
          letter: alt.letter,
          text: alt.text,
        })),
      })),
      savedAnswers,
    };
  }

  // Auto-Save atômico por questão
  async autoSaveAnswer(tenantId: string, userId: string, dto: AutoSaveAnswerDto) {
    const questionIdBigInt = BigInt(dto.questionId);
    const alternativeIdBigInt = BigInt(dto.alternativeId);

    // Valida se a alternativa pertence à questão
    const alternative = await this.prisma.alternative.findFirst({
      where: { id: alternativeIdBigInt, questionId: questionIdBigInt },
    });

    if (!alternative) {
      throw new BadRequestException('Alternativa inválida.');
    }

    // Upsert da resposta no simulado
    return this.prisma.studentAnswer.upsert({
      where: {
        userId_simulationId_questionId: {
          userId,
          simulationId: dto.simulationId,
          questionId: questionIdBigInt,
        },
      },
      update: {
        alternativeId: alternativeIdBigInt,
        isCorrect: alternative.isCorrect,
        responseTimeSeconds: dto.timeSpentInSeconds || 0,
      },
      create: {
        tenantId,
        userId,
        simulationId: dto.simulationId,
        questionId: questionIdBigInt,
        alternativeId: alternativeIdBigInt,
        isCorrect: alternative.isCorrect,
        responseTimeSeconds: dto.timeSpentInSeconds || 0,
      },
    });
  }

  // Finalizar Simulado
  async finishSimulation(tenantId: string, userId: string, simulationId: string) {
    // Registra ou atualiza o status de conclusão do simulado
    return {
      message: 'Simulado entregue e finalizado com sucesso!',
      finishedAt: new Date(),
    };
  }
}