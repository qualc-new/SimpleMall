import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminTypeGuard } from '../../../common/guards/admin-type.guard';
import { BizError } from '../../../common/exceptions/business.exception';
import { PaymentService } from '../../core/payment/payment.service';

@Controller('admin/payments')
@UseGuards(AdminTypeGuard)
export class AdminPaymentController {
  constructor(private payment: PaymentService) {}

  @Post('mock-notify')
  mockNotify(
    @CurrentUser() user: { role?: string },
    @Body() body: { paymentNo: string; success?: boolean },
  ) {
    if (user.role !== 'SUPER') throw BizError.forbidden();
    return this.payment.handleNotify({
      paymentNo: body.paymentNo,
      success: body.success !== false,
    });
  }
}
