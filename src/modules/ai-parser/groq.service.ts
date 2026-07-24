import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface GeneratedQuestion {
  statement: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  source: string;
  explanation: string;
  alternatives: {
    letter: string;
    text: string;
    isCorrect: boolean;
  }[];
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  async parseTextToQuestions(rawText: string, sourceName: string): Promise<GeneratedQuestion[]> {
    this.logger.log('Iniciando geração automática de questões via Groq AI (Llama 3.3)...');

    const prompt = `
      Você é um professor e elaborador sênior de bancas de concursos e exames acadêmicos.
      Analise o texto do material didático fornecido abaixo e ELABORE de 3 a 5 questões inéditas de múltipla escolha em Português.

      Conteúdo do Material Didático:
      ---
      ${rawText}
      ---

      Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON contendo a chave "questions" com um array de questões.
      Estrutura exata exigida:
      {
        "questions": [
          {
            "statement": "Enunciado da questão",
            "difficulty": "EASY",
            "isTrick": false,
            "source": "${sourceName}",
            "explanation": "Fundamentação detalhada da resposta",
            "alternatives": [
              { "letter": "A", "text": "Opção A", "isCorrect": true },
              { "letter": "B", "text": "Opção B", "isCorrect": false },
              { "letter": "C", "text": "Opção C", "isCorrect": false },
              { "letter": "D", "text": "Opção D", "isCorrect": false }
            ]
          }
        ]
      }
    `;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especialista que responde EXCLUSIVAMENTE no formato JSON solicitado.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '{"questions": []}';
      const parsed = JSON.parse(content);

      const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [];

      return questionsArray.map((q: any) => ({
        ...q,
        source: q.source || sourceName,
      }));
    } catch (error) {
      this.logger.error('Erro ao gerar questões com Groq API:', error);
      throw error;
    }
  }
}