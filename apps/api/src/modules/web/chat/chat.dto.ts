import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

/** 对话消息 */
class ChatMessageDto {
  @IsString()
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

/** AI 对话请求 */
export class ChatCompletionsDto {
  /** 消息列表（客户端只需发送最新一条；后端从 Redis 恢复历史） */
  @IsArray()
  messages!: ChatMessageDto[];

  /** 对话 ID（用于恢复上下文） */
  @IsOptional()
  @IsString()
  conversation_id?: string;

  /** 是否流式返回 */
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
