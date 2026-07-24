import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

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
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async parseTextToQuestions(rawText: string, sourceName: string): Promise<GeneratedQuestion[]> {
    this.logger.log('Iniciando geração automática de questões baseada no material...');

    const prompt = `
      Você é um professor e elaborador sênior de bancas de concursos públicos e exames acadêmicos.
      Analise o texto do material didático/cartilha fornecido abaixo e ELABORE questões inéditas de múltipla escolha para testar o conhecimento do aluno sobre os pontos mais importantes do texto.
      
      Conteúdo do Material Didático:
      ---
      ${rawText}
      ---
      
      Instruções de Elaboração:
      1. Crie entre 3 e 5 questões inéditas focadas nos conceitos chave do texto.
      2. Cada questão deve ter 4 alternativas (A, B, C, D) e APENAS UMA alternativa correta.
      3. Classifique a dificuldade (EASY, MEDIUM ou HARD).
      4. Se houver um ponto do texto que propicie uma confusão comum do aluno, marque 'isTrick: true' e elabore a questão como uma pegadinha inteligente.
      5. Na 'explanation' (justificativa), explique fundamentando com trechos do texto por que o gabarito está certo e por que as outras opções estão erradas.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Lista de questões inéditas geradas a partir do material',
            items: {
              type: Type.OBJECT,
              properties: {
                statement: { type: Type.STRING, description: 'Enunciado da questão elaborada' },
                difficulty: { type: Type.STRING, enum: ['EASY', 'MEDIUM', 'HARD'] },
                isTrick: { type: Type.BOOLEAN, description: 'Indica se possui pegadinha' },
                source: { type: Type.STRING },
                explanation: { type: Type.STRING, description: 'Fundamentação baseada no texto' },
                alternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      letter: { type: Type.STRING },
                      text: { type: Type.STRING },
                      isCorrect: { type: Type.BOOLEAN },
                    },
                    required: ['letter', 'text', 'isCorrect'],
                  },
                },
              },
              required: ['statement', 'difficulty', 'isTrick', 'explanation', 'alternatives'],
            },
          },
        },
      });

      const questionsJson = JSON.parse(response.text || '[]');

      return questionsJson.map((q: GeneratedQuestion) => ({
        ...q,
        source: q.source || sourceName,
      }));
    } catch (error) {
      this.logger.error('Erro ao gerar questões com Gemini AI:', error);
      throw error;
    }
  }
}