import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Semeando banco de dados...');

  // 1. Cria o Tenant B2B de teste
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

  // 2. Hash da senha com bcrypt
  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. UUID Válido para a model User
  const demoUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  // 4. Cria usuário do Aluno/Admin vinculado ao Tenant
  const user = await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      email: 'aluno@alfa.com.br',
      passwordHash,
      role: UserRole.STUDENT,
      tenantId: tenant.id,
      isActive: true,
    },
  });

  console.log('✅ Seed executado com sucesso!');
  console.log(`Tenant ID: ${tenant.id}`);
  console.log(`Usuário ID: ${user.id}`);
  console.log(`E-mail: ${user.email} | Senha: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });