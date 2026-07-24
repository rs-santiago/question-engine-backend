import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AIExtractionResult } from '../interfaces/ai-response.interface';

@Processor('ai-importer-queue')
@Injectable()
export class AiImporterProcessor extends WorkerHost {
  private readonly logger = new Logger(AiImporterProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ tenantId: string; topicId: string; fileUrl: string }>): Promise<any> {
    const { tenantId, topicId, fileUrl } = job.data;
    this.logger.log(`[Job ${job.id}] Iniciando extração via IA para o Tenant: ${tenantId}`);

    try {
      // 1. Deduz o saldo de tokens do Tenant
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { aiTokenBalance: { decrement: 10 } },
      });

      // 2. Chama o Serviço de IA (Mock/OpenAI API com Structured Outputs)
      const extractedData: AIExtractionResult = await this.mockAiExtraction(fileUrl);

      // 3. Persiste todas as questões e alternativas de forma atômica ($transaction)
      await this.prisma.$transaction(async (tx) => {
        for (const q of extractedData.questions) {
          const createdQuestion = await tx.question.create({
            data: {
              tenantId,
              topicId,
              statement: q.statement,
              explanation: q.explanation,
              difficulty: q.difficulty,
              isTrick: q.isTrick,
              source: q.source || 'Importação via IA',
              status: 'PUBLISHED',
              alternatives: {
                create: q.alternatives.map((alt) => ({
                  letter: alt.letter,
                  text: alt.text,
                  isCorrect: alt.isCorrect,
                  justification: alt.justification,
                })),
              },
            },
          });
          this.logger.log(`Questão ID ${createdQuestion.id} importada com sucesso!`);
        }
      });

      return { status: 'SUCCESS', questionsCount: extractedData.questions.length };
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Erro ao processar importação por IA:`, error);
      throw error;
    }
  }

  // Simulação do retorno estruturado da IA (Substituível pelo SDK da OpenAI/Gemini)
  private async mockAiExtraction(fileUrl: string): Promise<AIExtractionResult> {
    return {
      questions: [
        {
          statement: 'De acordo com a CF/88, qual o prazo de validade de um concurso público?',
          explanation: 'Conforme o Art. 37, III da CF/88, o prazo é de até 2 anos, prorrogável uma vez.',
          difficulty: 'EASY',
          isTrick: false,
          source: 'Banca CESPE',
          alternatives: [
            { letter: 'A', text: 'Até 1 ano, não prorrogável.', isCorrect: false },
            { letter: 'B', text: 'Até 2 anos, prorrogável uma vez por igual período.', isCorrect: true, justification: 'Artigo 37, III da CF.' },
            { letter: 'C', text: 'Indeterminado.', isCorrect: false },
            { letter: 'D', text: 'Até 5 anos.', isCorrect: false },
          ],
        },
      ],
    };
  }
}