/** 顶栏搜索：首页标签跳转搜索结果页；搜索页回填 q 参数 */

export function useHeaderSearch() {
  const keyword = useState<string>('header-keyword', () => '');
  const route = useRoute();
  const router = useRouter();

  function syncFromRoute() {
    if (route.path === '/search') {
      const q = route.query.q;
      keyword.value = typeof q === 'string' ? q : '';
      return;
    }
    if (route.path === '/') {
      keyword.value = '';
    }
  }

  /** 首页热门标签：跳转搜索结果页（闲鱼 /search?q= 模式） */
  function searchByTag(name: string) {
    router.push({ path: '/search', query: { q: name } });
  }

  function submitSearch() {
    const q = keyword.value.trim();
    if (!q) {
      router.push('/search');
      return;
    }
    router.push({ path: '/search', query: { q } });
  }

  watch(
    () => [route.path, route.query.q],
    () => syncFromRoute(),
    { immediate: true },
  );

  return { keyword, searchByTag, submitSearch, syncFromRoute };
}
