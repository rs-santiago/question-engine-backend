import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService (Unit Test)', () => {
  let service: WebhooksService;
  let prismaMock: any;
  let configServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      tenant: {
        upsert: jest.fn<any>(),
        updateMany: jest.fn<any>(),
      },
    };

    configServiceMock = {
      get: jest.fn<any>().mockReturnValue(undefined),
    };

    service = new WebhooksService(prismaMock, configServiceMock);
  });

  it('deve auto-provisionar um tenant com 500 tokens ao receber compra paga da Kiwify', async () => {
    prismaMock.tenant.upsert.mockResolvedValue({
      id: 'tenant-auto-1',
      name: 'Plataforma Rodrigo Santos',
      status: 'ACTIVE',
    });

    const payloadMock: any = {
      order_id: 'ord_12345',
      order_status: 'paid',
      Customer: {
        full_name: 'Rodrigo Santos',
        email: 'rodrigo@email.com',
      },
      Product: { product_id: 'prod_1', product_name: 'Plano B2B EdTech' },
    };

    const result = await service.handleKiwifyWebhook(payloadMock);

    expect(prismaMock.tenant.upsert).toHaveBeenCalled();
    expect(result.status).toBe('PROVISIONED');
  });
});