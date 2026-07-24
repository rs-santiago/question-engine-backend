import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extrai o ID do tenant via Header x-tenant-id ou JWT
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException(
        'Identificador de Tenant B2B não fornecido na requisição.',
      );
    }

    // 2. Consulta o status do Tenant no PostgreSQL
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant B2B não encontrado.');
    }

    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Acesso suspenso para este Tenant.');
    }

    // 3. Injeta o tenantId no contexto da Request para uso global
    request.tenantId = tenant.id;
    return true;
  }
}