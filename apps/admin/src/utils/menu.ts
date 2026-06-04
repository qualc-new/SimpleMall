export const MENU_PATHS = [
  { key: '/', prefix: false },
  { key: '/categories', prefix: true },
  { key: '/brands', prefix: true },
  { key: '/tags', prefix: true },
  { key: '/service-guarantees', prefix: true },
  { key: '/express-templates', prefix: true },
  { key: '/products', prefix: true },
  { key: '/orders', prefix: true },
  { key: '/users', prefix: true },
  { key: '/dev/mock-pay', prefix: true },
] as const;

export function matchMenuKey(pathname: string): string {
  if (pathname === '/') return '/';
  const matched = MENU_PATHS.filter((m) => m.prefix && pathname.startsWith(m.key)).sort(
    (a, b) => b.key.length - a.key.length,
  );
  return matched[0]?.key ?? '/';
}

export const BREADCRUMB_LABELS: Record<string, string> = {
  '/': '仪表盘',
  '/categories': '类目管理',
  '/brands': '品牌管理',
  '/tags': '标签管理',
  '/service-guarantees': '服务保障',
  '/express-templates': '运费模板',
  '/products': '商品列表',
  '/orders': '订单列表',
  '/users': '商城用户',
  '/dev/mock-pay': '模拟支付',
};

export function buildBreadcrumbs(pathname: string): { title: string; href?: string }[] {
  const base = matchMenuKey(pathname);
  const items: { title: string; href?: string }[] = [{ title: '首页', href: '/' }];
  if (base !== '/') items.push({ title: BREADCRUMB_LABELS[base] ?? base, href: base });
  if (pathname.endsWith('/new')) items.push({ title: '发布商品' });
  else if (pathname.includes('/edit')) items.push({ title: '编辑商品' });
  else if (/^\/orders\/\d+$/.test(pathname)) items.push({ title: '订单详情' });
  return items;
}
