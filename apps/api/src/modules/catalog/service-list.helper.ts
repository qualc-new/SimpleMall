import { TagStatus } from '@simplemall/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';

/** 逗号分隔名称列表解析 */
export function parseCommaNames(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** C 端：按 SPU 配置顺序返回仍启用的服务保障名称 */
export async function resolveEnabledServiceGuarantees(
  prisma: PrismaService,
  serviceList?: string | null,
): Promise<string[]> {
  const names = parseCommaNames(serviceList);
  if (!names.length) return [];
  const rows = await prisma.serviceGuarantee.findMany({
    where: { name: { in: names }, status: TagStatus.ENABLED },
  });
  const enabled = new Set(rows.map((r) => r.name));
  return names.filter((n) => enabled.has(n));
}

/** 商品保存：service_list 须均为启用项 */
export async function assertSpuServiceListEnabled(prisma: PrismaService, serviceList?: string) {
  const names = parseCommaNames(serviceList);
  if (!names.length) return;
  const rows = await prisma.serviceGuarantee.findMany({
    where: { name: { in: names }, status: TagStatus.ENABLED },
  });
  const ok = new Set(rows.map((r) => r.name));
  const bad = names.filter((n) => !ok.has(n));
  if (bad.length) {
    throw new Error(`请先在服务保障管理启用或创建：${bad.join('、')}`);
  }
}
