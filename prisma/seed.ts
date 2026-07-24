import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Semeando banco de dados...');

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'alfa' },
    update: {},
    create: {
      name: 'Curso Alfa Preparatórios',
      subdomain: 'alfa',
      status: 'ACTIVE',
      aiTokenBalance: 1000,
    },
  });

  // 2. Disciplina (Subject)
  const subject = await prisma.subject.upsert({
    where: { id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
    update: {},
    create: {
      id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      name: 'Direito Constitucional',
      tenantId: tenant.id,
    },
  });

  // 3. Tópico (Topic)
  const topic = await prisma.topic.upsert({
    where: { id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' },
    update: {},
    create: {
      id: 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      name: 'Administração Pública (Art. 37 a 41)',
      subjectId: subject.id,
      tenantId: tenant.id,
    },
  });

  // 4. Hash da Senha
  const passwordHash = await bcrypt.hash('123456', 10);

  // 5. Usuário 1: Aluno (STUDENT)
  const studentUser = await prisma.user.upsert({
    where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    update: {
      role: UserRole.STUDENT,
    },
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'aluno@alfa.com.br',
      passwordHash,
      role: UserRole.STUDENT,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  // 6. Usuário 2: Professor (TEACHER)
  const teacherUser = await prisma.user.upsert({
    where: { id: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' },
    update: {
      role: UserRole.TEACHER,
    },
    create: {
      id: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      email: 'professor@alfa.com.br',
      passwordHash,
      role: UserRole.TEACHER,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  console.log('✅ Seed executado com sucesso!');
  console.log(`🎓 Aluno: ${studentUser.email} (Role: STUDENT)`);
  console.log(`👨‍🏫 Professor: ${teacherUser.email} (Role: TEACHER)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });