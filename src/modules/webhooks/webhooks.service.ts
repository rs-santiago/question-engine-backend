import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KiwifyWebhookDto } from './dto/kiwify-webhook.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // Processa compras aprovadas e canceladas da Kiwify
  async handleKiwifyWebhook(payload: KiwifyWebhookDto, signatureHeader?: string) {
    this.logger.log(`[Kiwify Webhook] Evento recebido para a ordem: ${payload.order_id}`);

    // Validação opcional de Secret em Produção
    const webhookSecret = this.configService.get<string>('KIWIFY_WEBHOOK_SECRET');
    if (webhookSecret && signatureHeader && signatureHeader !== webhookSecret) {
      throw new UnauthorizedException('Assinatura do Webhook da Kiwify inválida.');
    }

    const { order_status, Customer } = payload;
    
    // Gera um subdomínio limpo a partir do e-mail do cliente (ex: rodrigo.alfa -> rodrigoalfa)
    const subdomain = Customer.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Caso de Compra Aprovada/Paga: Provisiona ou Atualiza o Tenant B2B
    if (order_status === 'paid') {
      const tenant = await this.prisma.tenant.upsert({
        where: { subdomain },
        update: {
          status: 'ACTIVE',
          aiTokenBalance: { increment: 500 },
        },
        create: {
          name: `Plataforma ${Customer.full_name}`,
          subdomain,
          status: 'ACTIVE',
          customDomain: null,
          aiTokenBalance: 500,
        },
      });

      this.logger.log(`[Auto-Provisionamento] Tenant ${tenant.name} (${tenant.id}) ativado com sucesso!`);
      return { status: 'PROVISIONED', tenantId: tenant.id };
    }

    // 2. Caso de Reembolso ou Estorno: Suspende o Tenant
    if (order_status === 'refunded' || order_status === 'chargedback') {
      await this.prisma.tenant.updateMany({
        where: { subdomain },
        data: { status: 'SUSPENDED' },
      });

      this.logger.warn(`[Auto-Provisionamento] Tenant do subdomínio '${subdomain}' SUSPENSO por reembolso.`);
      return { status: 'SUSPENDED' };
    }

    return { status: 'IGNORED' };
  }
}