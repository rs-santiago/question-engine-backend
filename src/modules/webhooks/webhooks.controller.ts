import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { KiwifyWebhookDto } from './dto/kiwify-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('kiwify')
  @HttpCode(HttpStatus.OK)
  async handleKiwify(
    @Body() payload: KiwifyWebhookDto,
    @Headers('x-kiwify-signature') signature?: string,
  ) {
    return this.webhooksService.handleKiwifyWebhook(payload, signature);
  }
}