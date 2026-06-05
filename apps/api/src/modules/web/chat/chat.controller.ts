import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ChatService } from '../../core/chat/chat.service';
import { ChatCompletionsDto } from './chat.dto';

/** C 端 AI 对话接口 */
@Controller('chat')
@UseGuards(UserTypeGuard)
export class ChatController {
  constructor(private chat: ChatService) {}

  /** POST /api/v1/chat/completions */
  @Post('completions')
  async completions(
    @CurrentUser() user: { userId: number },
    @Body() dto: ChatCompletionsDto,
    @Res() res: Response,
  ) {
    const lastMsg = dto.messages[dto.messages.length - 1];
    if (!lastMsg?.content) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    if (dto.stream) {
      // SSE 流式响应
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        for await (const chunk of this.chat.chatStream(user.userId, lastMsg.content, dto.conversation_id)) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      } catch {
        res.write(`data: ${JSON.stringify({ content: '抱歉，AI 服务暂时不可用。', error: true })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // 非流式响应
      try {
        const result = await this.chat.chat(user.userId, lastMsg.content, dto.conversation_id);
        return res.json(result);
      } catch {
        return res.status(500).json({
          message: { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后重试。' },
        });
      }
    }
  }
}
