import type { Budget, Category, Expense } from "@prisma/client";

export type ExpenseWithCategory = Expense & {
  category: Category;
};

export type BudgetWithCategory = Budget & {
  category: Category;
};

export function serializeExpense(item: ExpenseWithCategory) {
  return {
    ...item,
    category: item.categoryId,
    categoryName: item.category.name,
  };
}

export function serializeBudget(item: BudgetWithCategory) {
  return {
    ...item,
    categoryName: item.category.name,
  };
}
