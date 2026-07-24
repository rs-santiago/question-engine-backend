import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AiImporterProcessor } from './ai-importer.processor';

describe('AiImporterProcessor (Unit Test)', () => {
  let processor: AiImporterProcessor;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      tenant: { update: jest.fn<any>().mockResolvedValue({}) },
      $transaction: jest.fn<any>().mockImplementation(async (cb: any) => {
        return cb({
          question: {
            create: jest.fn<any>().mockResolvedValue({ id: BigInt(1) }),
          },
        });
      }),
    };

    processor = new AiImporterProcessor(prismaMock);
  });

  it('deve debitar saldo do tenant e salvar as questões no banco de dados', async () => {
    const jobMock: any = {
      id: 'job-100',
      data: {
        tenantId: 'tenant-uuid-1',
        topicId: 'topic-uuid-1',
        fileUrl: 'http://s3.aws.com/prova.pdf',
      },
    };

    const result = await processor.process(jobMock);

    expect(prismaMock.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-uuid-1' },
      data: { aiTokenBalance: { decrement: 10 } },
    });
    expect(result.status).toBe('SUCCESS');
    expect(result.questionsCount).toBeGreaterThan(0);
  });
});