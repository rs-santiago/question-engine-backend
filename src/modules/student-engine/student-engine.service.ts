import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class StudentEngineService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Busca lista de questões filtradas e isoladas por Tenant
  async getQuestions(tenantId: string, filters: FilterQuestionsDto) {
    const questions = await this.prisma.question.findMany({
      where: {
        tenantId,
        status: 'PUBLISHED',
        ...(filters.topicId && { topicId: filters.topicId }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
      },
      take: filters.limit,
      select: {
        id: true,
        statement: true,
        difficulty: true,
        isTrick: true,
        source: true,
        alternatives: {
          select: {
            id: true,
            letter: true,
            text: true,
          },
        },
      },
    });

    // Converte BigInt para String/Number na resposta JSON para não estourar a serialização
    return questions.map((q) => ({
      ...q,
      id: q.id.toString(),
      alternatives: q.alternatives.map((alt) => ({
        ...alt,
        id: alt.id.toString(),
      })),
    }));
  }

  // 2. Processa a resposta do aluno e salva o cômputo
  async submitAnswer(tenantId: string, userId: string, dto: SubmitAnswerDto) {
  if (!tenantId) {
    throw new BadRequestException('Tenant não informado.');
  }

  let questionIdBigInt: bigint;
  let alternativeIdBigInt: bigint;

  try {
    questionIdBigInt = BigInt(dto.questionId);
    alternativeIdBigInt = BigInt(dto.alternativeId);
  } catch (error) {
    throw new BadRequestException('IDs de questão ou alternativa em formato inválido.');
  }

  // 1. Busca a questão pertencente ao Tenant
  const question = await this.prisma.question.findFirst({
    where: { 
      id: questionIdBigInt, 
      tenantId 
    },
    include: { alternatives: true },
  });

  if (!question) {
    throw new NotFoundException('Questão não encontrada.');
  }

  // 2. Localiza a alternativa selecionada
  const selectedAlternative = question.alternatives.find(
    (alt) => alt.id === alternativeIdBigInt,
  );

  if (!selectedAlternative) {
    throw new BadRequestException('Alternativa inválida para esta questão.');
  }

  const isCorrect = selectedAlternative.isCorrect;

  // 3. Grava no banco com nomes exatos das colunas do schema
  const answerRecord = await this.prisma.studentAnswer.create({
    data: {
      tenantId,
      userId,
      questionId: questionIdBigInt,
      alternativeId: alternativeIdBigInt,
      isCorrect,
      responseTimeSeconds: Number(dto.timeSpentInSeconds) || 0,
    },
  });

    const correctAlternative = question.alternatives.find((a) => a.isCorrect);

    return {
      answerId: answerRecord.id.toString(),
      isCorrect,
      explanation: question.explanation,
      correctAlternativeId: correctAlternative?.id.toString(),
      justification: selectedAlternative.justification,
    };
  }

  // 3. Retorna o painel de estatísticas acumuladas do aluno
  async getStudentPerformance(tenantId: string, userId: string) {
    const answers = await this.prisma.studentAnswer.findMany({
      where: { tenantId, userId },
    });

    const totalAnswered = answers.length;
    if (totalAnswered === 0) {
      return {
        totalAnswered: 0,
        correctCount: 0,
        accuracyPercentage: 0,
        averageTimeInSeconds: 0,
      };
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;

    const totalTimeSpent = answers.reduce(
      (sum, answer) => sum + (answer.responseTimeSeconds ?? 0),
      0,
    );

    return {
      totalAnswered,
      correctCount,
      accuracyPercentage: Number(((correctCount / totalAnswered) * 100).toFixed(2)),
      averageTimeInSeconds: Math.round(totalTimeSpent / totalAnswered),
    };
  }
}