import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsGrid } from '@/components/dashboard/StatCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { defaultCategories } from '@/lib/mock-data';
import { Category, Expense, CategorySummary, DailyExpense, Currency } from '@/types/expense';
import { Card, CardContent } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/format';
import { apiFetch } from '@/lib/api';

// Use relative URL - same domain serves both frontend and API
const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ServerExpense = {
  id: string;
  amountCents: number;
  currency: string;
  category: string;
  merchant: string | null;
  note: string | null;
  expenseDate: string;
  createdAt: string;
};

type ServerCategory = {
  id: string;
  name: string;
  createdAt?: string;
};

export default function Dashboard() {
  const { settings } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = settings?.defaultCurrency || 'ILS';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [expensesData, categoriesData] = await Promise.all([
          apiFetch('/api/expenses'),
          apiFetch('/api/categories')
        ]);

        const serverExpenses: ServerExpense[] = Array.isArray(expensesData?.items) ? expensesData.items : [];
        const serverCategories: ServerCategory[] = Array.isArray(categoriesData?.items) ? categoriesData.items : [];

        const mappedCategories = serverCategories.length
          ? serverCategories.map(mapServerCategory)
          : defaultCategories;

        const mappedExpenses = serverExpenses.map(se => mapServerExpense(se, mappedCategories));

        setCategories(mappedCategories);
        setExpenses(mappedExpenses);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function mapServerCategory(sc: ServerCategory): Category {
    const categoryMap: Record<string, { color: string; icon: string }> = {
      'food': { color: '#10B981', icon: 'utensils' },
      'transportation': { color: '#3B82F6', icon: 'car' },
      'transport': { color: '#3B82F6', icon: 'car' },
      'shopping': { color: '#8B5CF6', icon: 'shopping-bag' },
      'entertainment': { color: '#EC4899', icon: 'film' },
      'utilities': { color: '#F59E0B', icon: 'receipt' },
      'housing': { color: '#F97316', icon: 'home' },
      'health': { color: '#EF4444', icon: 'heart' },
      'education': { color: '#84CC16', icon: 'book' },
      'savings': { color: '#14B8A6', icon: 'piggy-bank' },
      'other': { color: '#6B7280', icon: 'more-horizontal' },
    };

    const normalized = sc.name.toLowerCase().replace(/[^a-z]/g, '');
    let categoryStyle = categoryMap[normalized];
    
    if (!categoryStyle) {
      const fallback = defaultCategories.find(d => 
        d.name.toLowerCase().includes(normalized) || 
        normalized.includes(d.name.toLowerCase().replace(/[^a-z]/g, ''))
      ) ?? defaultCategories[defaultCategories.length - 1];
      categoryStyle = { color: fallback.color, icon: fallback.icon };
    }

    return {
      id: sc.id,
      name: sc.name,
      color: categoryStyle.color,
      icon: categoryStyle.icon,
      createdAt: sc.createdAt ? new Date(sc.createdAt) : new Date(),
      updatedAt: new Date(),
    };
  }

  function mapServerExpense(se: ServerExpense, cats: Category[]): Expense {
    // se.category is actually the category ID, not the name
    const match = cats.find(c => c.id === se.category);
    const fallback = { ...defaultCategories[defaultCategories.length - 1], color: '#6B7280', icon: 'more-horizontal' };
    const category = match ?? { ...fallback, id: se.category, name: se.category };

    return {
      id: se.id,
      amount: se.amountCents / 100,
      currency: (se.currency as Currency) ?? 'ILS',
      category,
      categoryId: category.id,
      date: new Date(se.expenseDate ?? se.createdAt),
      merchant: se.merchant ?? 'Unknown',
      note: se.note ?? undefined,
      paymentMethod: 'other',
      createdAt: new Date(se.createdAt),
      updatedAt: new Date(se.createdAt),
    };
  }

  const summary = useMemo(() => {
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

    return {
      totalExpenses,
      expenseCount: thisMonth.length,
      averageExpense: thisMonth.length > 0 ? totalExpenses / thisMonth.length : 0,
      monthlyChange,
    };
  }, [expenses]);

  const categorySummaries = useMemo((): CategorySummary[] => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });

    const totalSpent = thisMonth.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals = thisMonth.reduce((acc, e) => {
      const key = e.category.name;
      if (!acc[key]) {
        acc[key] = { category: e.category, total: 0, count: 0 };
      }
      acc[key].total += e.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { category: Category; total: number; count: number }>);

    return Object.values(categoryTotals)
      .map(item => ({
        category: item.category,
        total: item.total,
        count: item.count,
        percentage: totalSpent > 0 ? (item.total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const dailyExpenses = useMemo((): DailyExpense[] => {
    const result: DailyExpense[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
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
  }, [expenses]);

  const recentExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [expenses]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
            <p className="text-muted-foreground">
              Track your expenses and monitor your financial health.
            </p>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
            <p className="text-muted-foreground">
              Track your expenses and monitor your financial health.
            </p>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please check your backend connection.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
          <p className="text-muted-foreground">
            Track your expenses and monitor your financial health.
          </p>
        </div>

        {/* Stats Grid */}
        <StatsGrid 
          totalExpenses={summary.totalExpenses}
          expenseCount={summary.expenseCount}
          averageExpense={summary.averageExpense}
          monthlyChange={summary.monthlyChange}
          monthlyBudget={(settings?.monthlyIncomeCents ?? 0) / 100}
          currency={currency}
        />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ExpenseChart data={dailyExpenses} currency={currency} />
          </div>
          <div>
            <CategoryBreakdown categories={categorySummaries} currency={currency} />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions expenses={recentExpenses} limit={8} currency={currency} />
      </div>
    </AppLayout>
  );
}
