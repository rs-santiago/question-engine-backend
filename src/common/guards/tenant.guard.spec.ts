// src/common/guards/tenant.guard.spec.ts
import { TenantGuard } from './tenant.guard';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

describe('TenantGuard (Unit Test)', () => {
  let guard: TenantGuard;
  let prismaServiceMock: any;

  beforeEach(() => {
    prismaServiceMock = {
      tenant: {
        findUnique: jest.fn(),
      },
    };
    guard = new TenantGuard(prismaServiceMock);
  });

  it('deve lançar UnauthorizedException se nenhum x-tenant-id for enviado', async () => {
    const contextMock: any = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };

    await expect(guard.canActivate(contextMock)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('deve lançar ForbiddenException se o Tenant estiver SUSPENDED', async () => {
    prismaServiceMock.tenant.findUnique.mockResolvedValue({
      id: 'tenant-123',
      status: 'SUSPENDED',
    });

    const contextMock: any = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-tenant-id': 'tenant-123' } }),
      }),
    };

    await expect(guard.canActivate(contextMock)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deve permitir acesso e injetar o tenantId na requisição se o Tenant estiver ACTIVE', async () => {
    prismaServiceMock.tenant.findUnique.mockResolvedValue({
      id: 'tenant-valid-uuid',
      status: 'ACTIVE',
    });

    const requestObj: any = { headers: { 'x-tenant-id': 'tenant-valid-uuid' } };
    const contextMock: any = {
      switchToHttp: () => ({
        getRequest: () => requestObj,
      }),
    };

    const canActivate = await guard.canActivate(contextMock);

    expect(canActivate).toBe(true);
    expect(requestObj.tenantId).toBe('tenant-valid-uuid');
  });
});