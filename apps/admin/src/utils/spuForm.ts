/** 表单元 ↔ API（金额：元 → 分） */

export function yuanToCent(v?: number | null): number | undefined {
  if (v == null || Number.isNaN(v)) return undefined;
  return Math.round(v * 100);
}

export function centToYuan(v?: number | null): number | undefined {
  if (v == null) return undefined;
  return v / 100;
}

export function imagesToText(images?: string[]): string {
  return (images ?? []).join('\n');
}

export function textToImages(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function attrToText(attr?: Record<string, unknown> | null): string {
  if (!attr || typeof attr !== 'object') return '';
  try {
    return JSON.stringify(attr, null, 2);
  } catch {
    return '';
  }
}

/** 标签数组 ↔ API 逗号串 */
export function tagsToList(raw?: string[] | string | null): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw) return [];
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function listToTags(tags?: string[]): string {
  return (tags ?? []).filter(Boolean).join(',');
}

export function textToAttr(text?: string): Record<string, unknown> | undefined {
  if (!text?.trim()) return undefined;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
