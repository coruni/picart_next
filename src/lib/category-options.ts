import type { CategoryOption } from "@/components/ui/CategorySelect";
import type { CategoryList } from "@/types";

export type CategoryOptionsBundle = {
  parents: CategoryOption[];
  childrenByParentId: Map<number, CategoryOption[]>;
};

/**
 * 把接口返回的分类树摊平成 CategorySelect 需要的父级选项 + 子级映射
 */
export function buildCategoryOptions(
  categories: CategoryList,
): CategoryOptionsBundle {
  const parents: CategoryOption[] = [];
  const childrenByParentId = new Map<number, CategoryOption[]>();

  for (const category of categories) {
    if (!category.parentId || category.parentId === 0) {
      parents.push({
        value: String(category.id),
        label: category.name,
        ...(category.avatar ? { avatar: category.avatar } : {}),
      });
    }

    if (category.children && category.children.length > 0) {
      childrenByParentId.set(
        category.id,
        category.children.map((child) => ({
          value: String(child.id),
          label: child.name,
          ...(child.avatar ? { avatar: child.avatar } : {}),
        })),
      );
    }
  }

  return { parents, childrenByParentId };
}
