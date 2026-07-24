import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { validate as validateUuid } from 'uuid'; // Importa o validador

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    // 1. Verifica se o header existe
    if (!tenantId) {
      throw new BadRequestException('O header "x-tenant-id" é obrigatório.');
    }

    // 2. Valida se o formato do UUID é legítimo antes de consultar o banco
    if (!validateUuid(tenantId)) {
      // Se não for um UUID válido, lançamos um erro 400 amigável
      // Isso impede que a consulta findUnique() abaixo falhe com o erro do Prisma
      throw new BadRequestException('O formato do "x-tenant-id" fornecido é inválido (deve ser um UUID).');
    }

    // 3. Consulta o status do Tenant no PostgreSQL
    // Agora esta consulta está segura contra erros de formato de UUID
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // 4. Valida se o Tenant existe
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado.');
    }

    // 5. Valida se o Tenant está ativo
    if (tenant.status !== 'ACTIVE') {
      throw new BadRequestException('O acesso para este Tenant está suspenso ou inativo.');
    }

    // Se tudo estiver certo, libera o acesso
    return true;
  }
}