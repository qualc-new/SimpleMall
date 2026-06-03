export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  sort: number;
}

export type CategoryTreeNode = Category & { children?: CategoryTreeNode[] };

/** 将扁平类目列表转为树（按 sort、id 排序） */
export function buildCategoryTree(list: Category[], parentId: number | null = null): CategoryTreeNode[] {
  return list
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map((c) => {
      const children = buildCategoryTree(list, c.id);
      const node: CategoryTreeNode = { ...c };
      if (children.length > 0) node.children = children;
      return node;
    });
}
