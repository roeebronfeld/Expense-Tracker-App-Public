import { Category, Expense, Budget, Currency, PaymentMethod, ExpenseSummary, CategorySummary, DailyExpense } from '@/types/expense';

// Default categories with icons and colors
export const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#10B981', icon: 'utensils', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Transportation', color: '#3B82F6', icon: 'car', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Entertainment', color: '#EC4899', icon: 'film', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Bills & Utilities', color: '#F59E0B', icon: 'receipt', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Healthcare', color: '#EF4444', icon: 'heart', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Travel', color: '#06B6D4', icon: 'plane', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Education', color: '#84CC16', icon: 'book', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'Other', color: '#6B7280', icon: 'more-horizontal', createdAt: new Date(), updatedAt: new Date() },
];

// Generate mock expenses for the last 90 days
function generateMockExpenses(): Expense[] {
  const merchants = {
    '1': ['McDonald\'s', 'Starbucks', 'Whole Foods', 'Trader Joe\'s', 'Chipotle', 'Domino\'s'],
    '2': ['Uber', 'Lyft', 'Shell Gas', 'Chevron', 'Parking', 'Metro'],
    '3': ['Amazon', 'Target', 'Walmart', 'Best Buy', 'Nike', 'IKEA'],
    '4': ['Netflix', 'Spotify', 'Cinema', 'Concert', 'Game Store', 'Museum'],
    '5': ['Electric Co.', 'Water Bill', 'Internet', 'Phone Bill', 'Insurance', 'Rent'],
    '6': ['Pharmacy', 'Doctor Visit', 'Dental', 'Vision', 'Gym', 'Supplements'],
    '7': ['Airbnb', 'Hotel', 'Flight', 'Car Rental', 'Tours', 'Travel Insurance'],
    '8': ['Udemy', 'Books', 'Coursera', 'School Supplies', 'Tuition', 'Workshop'],
    '9': ['Misc', 'Gift', 'Donation', 'Subscription', 'Service', 'Other'],
  };

  const paymentMethods: PaymentMethod[] = ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'paypal'];
  const expenses: Expense[] = [];

  for (let i = 0; i < 150; i++) {
    const categoryId = String(Math.floor(Math.random() * 9) + 1);
    const category = defaultCategories.find(c => c.id === categoryId)!;
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const merchantList = merchants[categoryId as keyof typeof merchants];
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];

    expenses.push({
      id: `exp-${i + 1}`,
      amount: Math.round((Math.random() * 200 + 5) * 100) / 100,
      currency: 'USD',
      category,
      categoryId,
      date,
      merchant,
      note: Math.random() > 0.7 ? 'Some note about this expense' : undefined,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      createdAt: date,
      updatedAt: date,
    });
  }

  return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const mockExpenses = generateMockExpenses();

export const mockBudgets: Budget[] = [
  { id: 'b1', categoryId: '1', category: defaultCategories[0], amount: 500, currency: 'USD', period: 'monthly', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b2', categoryId: '2', category: defaultCategories[1], amount: 300, currency: 'USD', period: 'monthly', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b3', categoryId: '3', category: defaultCategories[2], amount: 400, currency: 'USD', period: 'monthly', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b4', categoryId: '4', category: defaultCategories[3], amount: 150, currency: 'USD', period: 'monthly', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b5', categoryId: '5', category: defaultCategories[4], amount: 800, currency: 'USD', period: 'monthly', createdAt: new Date(), updatedAt: new Date() },
];

// Calculate summary data
export function calculateExpenseSummary(expenses: Expense[]): ExpenseSummary {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });

  const lastMonth = expenses.filter(e => {
    const expDate = new Date(e.date);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear();
  });

  const totalExpenses = thisMonth.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
  const monthlyChange = lastMonthTotal > 0 ? ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Find top category
  const categoryTotals = thisMonth.reduce((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategoryId = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0];
  const topCategory = defaultCategories.find(c => c.id === topCategoryId) || null;

  return {
    totalExpenses,
    expenseCount: thisMonth.length,
    averageExpense: thisMonth.length > 0 ? totalExpenses / thisMonth.length : 0,
    topCategory,
    monthlyChange,
  };
}

export function calculateCategorySummaries(expenses: Expense[], budgets: Budget[]): CategorySummary[] {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });

  const totalSpent = thisMonth.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = thisMonth.reduce((acc, e) => {
    if (!acc[e.categoryId]) {
      acc[e.categoryId] = { total: 0, count: 0 };
    }
    acc[e.categoryId].total += e.amount;
    acc[e.categoryId].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return defaultCategories.map(category => {
    const data = categoryTotals[category.id] || { total: 0, count: 0 };
    const budget = budgets.find(b => b.categoryId === category.id);
    return {
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
      budget: budget?.amount,
      budgetUsed: budget ? (data.total / budget.amount) * 100 : undefined,
    };
  }).sort((a, b) => b.total - a.total);
}

export function calculateDailyExpenses(expenses: Expense[], days: number = 30): DailyExpense[] {
  const result: DailyExpense[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayExpenses = expenses.filter(e => {
      const expDate = new Date(e.date).toISOString().split('T')[0];
      return expDate === dateStr;
    });

    result.push({
      date: dateStr,
      total: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
      count: dayExpenses.length,
    });
  }

  return result;
}

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const expDate = new Date(date);
  const diffDays = Math.floor((now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
}
