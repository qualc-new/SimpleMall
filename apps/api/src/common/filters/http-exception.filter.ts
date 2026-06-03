import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const requestId = randomUUID().slice(0, 8);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 50000;
    let message = '服务器错误';

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { code: number; message: string };
      code = body.code;
      message = body.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const msg = (body as { message: string | string[] }).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      } else {
        message = String(body);
      }
      code = status === 401 ? 40100 : status === 403 ? 40300 : 42200;
    }

    res.status(status).json({ code, message, data: null, requestId });
  }
}
