// src/common/guards/tenant.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Identifica o tenant pelo Header ou pelo contexto injetado no token JWT
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Identificador de Tenant não fornecido na requisição.');
    }

    // Consulta e validação com cache no Redis (versão otimizada)
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

    // Injeta o tenantId diretamente no objeto da requisição
    request.tenantId = tenant.id;
    return true;
  }
}