import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService } from '../modules/ai-parser/groq.service';

const PDFParser = require('pdf2json');

@Processor('ingestion-queue')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groqService: GroqService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[Job ${job.id}] Iniciando processamento do arquivo: ${job.data.fileName}`);
    
    // Progresso 10%: Início
    await job.updateProgress({ percent: 10, message: 'Extraindo texto do PDF...' });

    const { tenantId, filePath, sourceName, topicId } = job.data;

    try {
      // 1. Extração de texto
      const rawText = await this.extractTextFromPdf(filePath);

      // Progresso 40%: Texto extraído, enviando para a IA
      await job.updateProgress({ percent: 40, message: 'Elaborando questões com Groq AI...' });

      // 2. Chama a Groq API
      const extractedQuestions = await this.groqService.parseTextToQuestions(
        rawText,
        sourceName || 'Importação PDF',
      );

      // Progresso 70%: Resposta recebida, garantindo estrutura de banco
      await job.updateProgress({ percent: 70, message: 'Estruturando tópicos e acervo...' });

      let targetTopicId = topicId;
      if (!targetTopicId) {
        let defaultSubject = await this.prisma.subject.findFirst({
          where: { tenantId, name: 'Geral' },
        });

        if (!defaultSubject) {
          defaultSubject = await this.prisma.subject.create({
            data: { tenantId, name: 'Geral' },
          });
        }

        let defaultTopic = await this.prisma.topic.findFirst({
          where: { tenantId, subjectId: defaultSubject.id, name: 'Geral' },
        });

        if (!defaultTopic) {
          defaultTopic = await this.prisma.topic.create({
            data: { tenantId, subjectId: defaultSubject.id, name: 'Geral' },
          });
        }

        targetTopicId = defaultTopic.id;
      }

      // Progresso 85%: Gravando no PostgreSQL
      await job.updateProgress({ percent: 85, message: 'Salvando questões no banco de dados...' });

      for (const q of extractedQuestions) {
        await this.prisma.question.create({
          data: {
            tenantId,
            topicId: targetTopicId,
            statement: q.statement,
            difficulty: q.difficulty,
            isTrick: q.isTrick,
            source: q.source,
            explanation: q.explanation,
            status: 'PUBLISHED',
            alternatives: {
              create: q.alternatives.map((alt) => ({
                letter: alt.letter,
                text: alt.text,
                isCorrect: alt.isCorrect,
              })),
            },
          },
        });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Progresso 100%: Sucesso
      await job.updateProgress({ percent: 100, message: 'Concluído com sucesso!' });

      return { success: true, count: extractedQuestions.length };

    } catch (error) {
      this.logger.error(`[Job ${job.id}] Falha ao processar arquivo PDF:`, error);
      throw error;
    }
  }

  private extractTextFromPdf(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(errData.parserError || 'Erro ao processar estrutura do PDF.');
      });

      pdfParser.on('pdfParser_dataReady', () => {
        const parsedText = pdfParser.getRawTextContent();
        resolve(parsedText);
      });

      pdfParser.loadPDF(filePath);
    });
  }
}