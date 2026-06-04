import { Body, Controller, Get, Headers, Post, Query, Res, UseGuards } from '@nestjs/common';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { Response } from 'express';
import { PayChannel } from '@simplemall/shared';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaymentService } from '../../core/payment/payment.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Controller()
export class PaymentController {
  constructor(
    private payment: PaymentService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(UserTypeGuard)
  @Post('payments')
  create(
    @CurrentUser() user: { userId: number },
    @Body() body: { orderId: number; channel: PayChannel },
  ) {
    return this.payment.create(user.userId, body.orderId, body.channel);
  }

  @Public()
  @Post('payments/notify/alipay')
  notifyAlipay(@Body() body: Record<string, unknown>, @Headers('x-mock-sign') sign: string) {
    const raw = JSON.stringify(body);
    if (!this.payment.verifySign(raw, sign)) {
      return { code: 'FAIL', message: 'invalid sign' };
    }
    return this.payment.handleNotify({
      paymentNo: String(body.paymentNo),
      success: body.trade_status === 'TRADE_SUCCESS',
    });
  }

  @Public()
  @Post('payments/notify/wechat')
  notifyWechat(@Body() body: Record<string, unknown>, @Headers('x-mock-sign') sign: string) {
    const raw = JSON.stringify(body);
    if (!this.payment.verifySign(raw, sign)) {
      return { code: 'FAIL', message: 'invalid sign' };
    }
    const resource = (body.resource ?? body) as Record<string, unknown>;
    return this.payment.handleNotify({
      paymentNo: String(resource.paymentNo ?? body.paymentNo),
      success: resource.trade_state === 'SUCCESS' || body.success === true,
    });
  }

  @Public()
  @Get('mock-pay')
  async mockPayPage(@Query('paymentNo') paymentNo: string, @Res() res: Response) {
    const pay = await this.prisma.payment.findUnique({ where: { paymentNo } });
    if (!pay) {
      res.status(404).send('支付单不存在');
      return;
    }
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    const successBody = JSON.stringify({ paymentNo, trade_status: 'TRADE_SUCCESS' });
    const successSign = this.payment.signBody(successBody);
    const failBody = JSON.stringify({ paymentNo, trade_status: 'CLOSED' });
    const failSign = this.payment.signBody(failBody);
    res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>模拟收银台</title></head>
<body style="font-family:sans-serif;padding:40px">
  <h2>模拟收银台</h2>
  <p>支付单号：${paymentNo}</p>
  <p>金额：¥${(pay.amount / 100).toFixed(2)}</p>
  <button id="ok">支付成功</button>
  <button id="fail">支付失败</button>
  <script>
    async function pay(raw, sign, success) {
      await fetch('/api/v1/payments/notify/alipay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Mock-Sign': sign },
        body: raw
      });
      if (success) location.href = '${webUrl}/orders/${pay.orderId}?paid=1';
      else alert('支付失败');
    }
    document.getElementById('ok').onclick = () => pay(${JSON.stringify(successBody)}, ${JSON.stringify(successSign)}, true);
    document.getElementById('fail').onclick = () => pay(${JSON.stringify(failBody)}, ${JSON.stringify(failSign)}, false);
  </script>
</body></html>`);
  }
}
