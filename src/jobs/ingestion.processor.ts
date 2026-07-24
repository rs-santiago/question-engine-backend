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

    const { tenantId, filePath, sourceName, topicId } = job.data;

    try {
      // 1. Extração de texto do PDF
      const rawText = await this.extractTextFromPdf(filePath);

      this.logger.log(
        `[Job ${job.id}] Texto extraído com sucesso (${rawText.length} caracteres). Enviando para Groq AI...`,
      );

      // 2. Processa via Groq API
      const extractedQuestions = await this.groqService.parseTextToQuestions(
        rawText,
        sourceName || 'Importação PDF',
      );

      this.logger.log(
        `[Job ${job.id}] ${extractedQuestions.length} questões geradas pela Groq AI. Gravando no PostgreSQL...`,
      );

      // 3. Resolve a hierarquia de Subject e Topic para atender o Schema
      let targetTopicId = topicId;

      if (!targetTopicId) {
        // Garante a existência do Subject 'Geral' para este Tenant
        let defaultSubject = await this.prisma.subject.findFirst({
          where: { tenantId, name: 'Geral' },
        });

        if (!defaultSubject) {
          defaultSubject = await this.prisma.subject.create({
            data: {
              tenantId,
              name: 'Geral',
            },
          });
        }

        // Garante a existência do Topic 'Geral' vinculado ao Subject 'Geral'
        let defaultTopic = await this.prisma.topic.findFirst({
          where: { tenantId, subjectId: defaultSubject.id, name: 'Geral' },
        });

        if (!defaultTopic) {
          defaultTopic = await this.prisma.topic.create({
            data: {
              tenantId,
              subjectId: defaultSubject.id,
              name: 'Geral',
            },
          });
        }

        targetTopicId = defaultTopic.id;
      }

      // 4. Salva as questões e alternativas no banco
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

      // 5. Apaga o arquivo do disco apenas após finalizar o processo com sucesso
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      this.logger.log(
        `[Job ${job.id}] Finalizado com sucesso! ${extractedQuestions.length} questões salvas no banco.`,
      );
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