import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateQuestionDto) {
    let targetTopicId = dto.topicId;

    // Se o topicId não foi enviado, busca qualquer tópico existente cadastrado no Tenant
    if (!targetTopicId) {
      const existingTopic = await this.prisma.topic.findFirst({
        where: { tenantId },
      });

      if (!existingTopic) {
        throw new BadRequestException(
          'Nenhum Tópico/Disciplina cadastrado no Tenant. Forneça um topicId válido.',
        );
      }

      targetTopicId = existingTopic.id;
    }

    return this.prisma.question.create({
      data: {
        statement: dto.statement,
        difficulty: dto.difficulty,
        isTrick: dto.isTrick ?? false,
        source: dto.source,
        explanation: dto.explanation,
        tenant: {
          connect: { id: tenantId },
        },
        topic: {
          connect: { id: targetTopicId },
        },
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
        topic: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.question.findMany({
      where: { tenantId },
      include: {
        alternatives: true,
        topic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}