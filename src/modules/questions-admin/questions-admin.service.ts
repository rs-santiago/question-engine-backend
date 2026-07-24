import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateQuestionDto {
  statement: string;
  source: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  explanation?: string;
  topicId?: string;
  alternatives: {
    letter: string;
    text: string;
    isCorrect: boolean;
  }[];
}

@Injectable()
export class QuestionsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
  ) {}

  /**
   * Lista todas as questões cadastradas do Tenant atual
   */
  async findAllByTenant(tenantId: string) {
    return this.prisma.question.findMany({
      where: { tenantId },
      include: {
        alternatives: true,
        topic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Alias para manter compatibilidade com o controller caso ele chame findAll
  async findAll(tenantId: string) {
    return this.findAllByTenant(tenantId);
  }

  /**
   * Cadastro manual de uma única questão
   */
  async createQuestion(tenantId: string, dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        tenantId,
        statement: dto.statement,
        source: dto.source,
        difficulty: dto.difficulty,
        isTrick: dto.isTrick,
        explanation: dto.explanation,
        topicId: dto.topicId || null,
        alternatives: {
          create: dto.alternatives.map((alt) => ({
            letter: alt.letter,
            text: alt.text,
            isCorrect: alt.isCorrect,
          })),
        },
      },
      include: {
        alternatives: true,
      },
    });
  }

  // Alias para manter compatibilidade com o controller caso ele chame create
  async create(tenantId: string, dto: CreateQuestionDto) {
    return this.createQuestion(tenantId, dto);
  }

  /**
   * Enfileira o upload do PDF para extração e geração de questões via IA (BullMQ)
   */
  async enqueuePdfProcessing(
    tenantId: string,
    file: Express.Multer.File,
    sourceName: string,
    topicId?: string,
  ) {
    const job = await this.ingestionQueue.add(
      'process-pdf',
      {
        tenantId,
        filePath: file.path,
        fileName: file.originalname,
        sourceName,
        topicId: topicId || null,
      },
      {
        attempts: 5, // Tenta até 5 vezes
        backoff: {
          type: 'fixed',
          delay: 20000, // Aguarda 20 segundos entre cada tentativa
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      message: 'Arquivo enviado para processamento com IA!',
      jobId: job.id,
    };
  }

  /**
   * Remove uma questão pelo ID (realizando a conversão para número/BigInt)
   */
  async deleteQuestion(tenantId: string, questionId: string | number) {
    const numericId = Number(questionId);

    const question = await this.prisma.question.findFirst({
      where: { 
        id: numericId, 
        tenantId 
      },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada ou não pertence ao seu Tenant.');
    }

    return this.prisma.question.delete({
      where: { id: numericId },
    });
  }
}