import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { defaultCategories, formatCurrency } from '@/lib/mock-data';
import { Category, Currency } from '@/types/expense';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { apiFetch } from '@/lib/api';

// Use relative URL - same domain serves both frontend and API
const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ServerBudget = {
  id: string;
  categoryId: string;
  category: { id: string; name: string; createdAt?: string };
  amountCents: number;
  currency: string;
  period: string;
  createdAt: string;
};

type ServerExpense = {
  id: string;
  amountCents: number;
  currency: string;
  category: string;
  expenseDate: string;
  createdAt: string;
};

type ServerCategory = {
  id: string;
  name: string;
  createdAt?: string;
};

type UiBudget = {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  currency: Currency;
  period: string;
  createdAt: Date;
};

export default function Budgets() {
  const { settings } = useSettings();
  const currency = settings?.defaultCurrency || 'ILS';
  
  const [budgets, setBudgets] = useState<UiBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<ServerExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [categoryIdInput, setCategoryIdInput] = useState<string>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');
  const [editCategoryIdInput, setEditCategoryIdInput] = useState<string>('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  function mapServerBudget(sb: ServerBudget, cats: Category[]): UiBudget {
    const match = cats.find(c => c.id === sb.categoryId);
    const fallback = defaultCategories[defaultCategories.length - 1];
    const category = match ?? { ...fallback, id: sb.categoryId, name: sb.category.name };

    return {
      id: sb.id,
      categoryId: sb.categoryId,
      category,
      amount: sb.amountCents / 100,
      currency: (sb.currency as Currency) ?? 'ILS',
      period: sb.period ?? 'monthly',
      createdAt: new Date(sb.createdAt),
    };
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [budgetsData, categoriesData, expensesData] = await Promise.all([
        apiFetch('/api/budgets'),
        apiFetch('/api/categories'),
        apiFetch('/api/expenses'),
      ]);

      const serverBudgets: ServerBudget[] = Array.isArray(budgetsData?.items) ? budgetsData.items : [];
      const serverCategories: ServerCategory[] = Array.isArray(categoriesData?.items) ? categoriesData.items : [];
      const serverExpenses: ServerExpense[] = Array.isArray(expensesData?.items) ? expensesData.items : [];

      const mappedCategories = serverCategories.length
        ? serverCategories.map(mapServerCategory)
        : defaultCategories;

      const mappedBudgets = serverBudgets.map(sb => mapServerBudget(sb, mappedCategories));

      setCategories(mappedCategories);
      setBudgets(mappedBudgets);
      setExpenses(serverExpenses);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load budgets data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const budgetsWithSpending = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const expDate = new Date(e.expenseDate ?? e.createdAt);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });

    return budgets.map(budget => {
      // Compare by category ID, not name
      const categoryExpenses = thisMonth.filter(e => e.category === budget.category.id);
      const spent = categoryExpenses.reduce((sum, e) => sum + e.amountCents / 100, 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        ...budget,
        spent,
        percentage,
        remaining: budget.amount - spent,
      };
    });
  }, [budgets, expenses]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetsWithSpending.filter(b => b.percentage > 100).length;

  function openAdd() {
    setError(null);
    setEditOpen(false);
    setDeleteOpen(false);
    setAmountInput('');
    setCategoryIdInput('');
    setAddOpen(true);
  }

  async function createBudget() {
    const amount = parseFloat(amountInput);
    const amountCents = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
    const categoryId = categoryIdInput.trim();

    if (!amountCents) {
      setError('Amount must be a positive number');
      return;
    }
    if (!categoryId) {
      setError('Category is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          amountCents,
          currency,
          categoryId,
          period: 'monthly',
        }),
      });

      setAddOpen(false);
      await fetchData();
    } catch (e: any) {
      if (e?.message?.includes('409') || e?.message?.toLowerCase().includes('already exists')) {
        setError('Budget already exists for this category');
      } else if (e?.message?.includes('400') || e?.message?.toLowerCase().includes('invalid')) {
        setError(e?.message ?? 'Invalid budget data');
      } else {
        setError(e?.message ?? 'Failed to create budget');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(budget: UiBudget) {
    setError(null);
    setDeleteOpen(false);
    setEditId(budget.id);
    setEditAmountInput(String(budget.amount));
    setEditCategoryIdInput(budget.categoryId);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editId) return;

    const payload: any = {};
    const amount = parseFloat(editAmountInput);
    if (!Number.isNaN(amount) && amount > 0) payload.amountCents = Math.round(amount * 100);

    const catId = editCategoryIdInput.trim();
    if (catId) payload.categoryId = catId;

    if (Object.keys(payload).length === 0) {
      setError('No fields to update');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/budgets/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditOpen(false);
      setEditId(null);
      await fetchData();
    } catch (e: any) {
      if (e?.message?.includes('404') || e?.message?.toLowerCase().includes('not found')) {
        setError('Budget not found');
      } else if (e?.message?.includes('400') || e?.message?.toLowerCase().includes('invalid')) {
        setError(e?.message ?? 'Invalid budget data');
      } else {
        setError(e?.message ?? 'Failed to update budget');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openDelete(budget: UiBudget) {
    setError(null);
    setEditOpen(false);
    setDeleteId(budget.id);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/budgets/${deleteId}`, { method: 'DELETE' });

      setDeleteOpen(false);
      setDeleteId(null);
      await fetchData();
    } catch (e: any) {
      if (e?.message?.includes('404') || e?.message?.toLowerCase().includes('not found')) {
        setError('Budget not found');
      } else {
        setError(e?.message ?? 'Failed to delete budget');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
              <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
              <p className="text-muted-foreground">
                Set spending limits for each category
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading budgets data...</p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
            <p className="text-muted-foreground">
              Set spending limits for each category
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold font-mono-numbers mt-1">
                {formatCurrency(totalBudget, currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold font-mono-numbers mt-1">
                {formatCurrency(totalSpent, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% of total budget
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              {overBudgetCount > 0 ? (
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-lg font-semibold text-warning">
                    {overBudgetCount} over budget
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-lg font-semibold text-success">
                    On track
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetsWithSpending.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No budgets yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            budgetsWithSpending.map((budget, index) => {
              const isOverBudget = budget.percentage > 100;
              const isWarning = budget.percentage > 80 && budget.percentage <= 100;

              return (
                <Card 
                  key={budget.id}
                  className={cn(
                    "animate-fade-in-up opacity-0",
                    isOverBudget && "border-destructive/50"
                  )}
                  style={{ animationDelay: `${(index + 3) * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${budget.category.color}20` }}
                        >
                          <TrendingUp 
                            className="h-5 w-5" 
                            style={{ color: budget.category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{budget.category.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {budget.period} budget
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Budget actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(budget)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => openDelete(budget)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono-numbers font-medium">
                          {formatCurrency(budget.spent, currency)}
                        </span>
                        <span className="text-muted-foreground font-mono-numbers">
                          {formatCurrency(budget.amount, currency)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className={cn(
                          "h-2",
                          isOverBudget && "[&>div]:bg-destructive",
                          isWarning && "[&>div]:bg-warning"
                        )}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={isOverBudget ? 'destructive' : isWarning ? 'warning' : 'success'}
                        >
                          {budget.percentage.toFixed(0)}% used
                        </Badge>
                        <span className={cn(
                          "font-mono-numbers",
                          isOverBudget ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(budget.remaining), currency)} {isOverBudget ? 'over' : 'left'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Amount (e.g. 500)"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createBudget();
                }}
              />
              <Select
                value={categoryIdInput}
                onValueChange={(value) => setCategoryIdInput(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={createBudget} disabled={submitting || !amountInput.trim() || !categoryIdInput.trim()}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Amount (e.g. 500)"
                value={editAmountInput}
                onChange={(e) => setEditAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                }}
              />
              <Select
                value={editCategoryIdInput}
                onValueChange={(value) => setEditCategoryIdInput(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
            </AlertDialogHeader>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
