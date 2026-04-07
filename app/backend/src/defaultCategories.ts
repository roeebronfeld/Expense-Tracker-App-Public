/**
 * Default categories created automatically for each new user
 */
export const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Drinks" },
  { id: "transport", name: "Transportation" },
  { id: "housing", name: "Housing" },
  { id: "utilities", name: "Utilities" },
  { id: "health", name: "Health" },
  { id: "entertainment", name: "Entertainment" },
  { id: "shopping", name: "Shopping" },
  { id: "education", name: "Education" },
  { id: "savings", name: "Savings" },
  { id: "other", name: "Other" },
] as const;

export type DefaultCategoryId = (typeof DEFAULT_CATEGORIES)[number]["id"];
