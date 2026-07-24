// test/integration/questions-tenant-isolation.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Isolamento Multi-tenant em Questões (Integration Test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantA_Id: string;
  let tenantB_Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // 1. Cria Tenant A e Tenant B no banco de testes
    const tenantA = await prisma.tenant.create({
      data: { name: 'Curso Alfa', subdomain: 'alfa' },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: 'Curso Beta', subdomain: 'beta' },
    });

    tenantA_Id = tenantA.id;
    tenantB_Id = tenantB.id;

    // 2. Cria uma questão exclusiva do Tenant A
    const subjectA = await prisma.subject.create({
      data: { tenantId: tenantA_Id, name: 'Direito' },
    });
    const topicA = await prisma.topic.create({
      data: { tenantId: tenantA_Id, subjectId: subjectA.id, name: 'Constitucional' },
    });

    await prisma.question.create({
      data: {
        tenantId: tenantA_Id,
        topicId: topicA.id,
        statement: 'Questão Exclusiva do Tenant A',
        difficulty: 'EASY',
      },
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany();
    await app.close();
  });

  it('Tenant B NÃO deve conseguir visualizar a questão do Tenant A', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/questions')
      .set('x-tenant-id', tenantB_Id) // Requisição simulando Tenant B
      .expect(200);

    // O resultado deve ser uma lista vazia para o Tenant B
    expect(response.body.data).toHaveLength(0);
  });

  it('Tenant A deve visualizar com sucesso a sua questão', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/questions')
      .set('x-tenant-id', tenantA_Id) // Requisição simulando Tenant A
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].statement).toBe('Questão Exclusiva do Tenant A');
  });
});