import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { StudentEngineService } from './student-engine.service';

describe('StudentEngineService (Unit Test)', () => {
  let service: StudentEngineService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      question: {
        findMany: jest.fn<any>(),
        findFirst: jest.fn<any>(),
      },
      studentAnswer: {
        create: jest.fn<any>(),
        findMany: jest.fn<any>(),
      },
    };

    service = new StudentEngineService(prismaMock);
  });

  it('deve calcular corretamente a taxa de acertos do aluno', async () => {
    prismaMock.studentAnswer.findMany.mockResolvedValue([
      { isCorrect: true, responseTimeSeconds: 30 },
      { isCorrect: false, responseTimeSeconds: 40 },
      { isCorrect: true, responseTimeSeconds: 50 },
    ]);

    const performance = await service.getStudentPerformance('tenant-1', 'user-1');

    expect(performance.totalAnswered).toBe(3);
    expect(performance.correctCount).toBe(2);
    expect(performance.accuracyPercentage).toBe(66.67);
    expect(performance.averageTimeInSeconds).toBe(40);
  });
});