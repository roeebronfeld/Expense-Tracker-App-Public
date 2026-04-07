import { useState, useMemo, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { defaultCategories, formatCurrency, formatDate } from '@/lib/mock-data';
import { Category, Currency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;
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

type UiExpense = {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  categoryId: string;
  date: Date;
  merchant: string;
  note?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function Expenses() {
  const { settings } = useSettings();
  const currency = settings?.defaultCurrency || 'ILS';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<UiExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [merchantInput, setMerchantInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState<Date | undefined>(undefined);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');
  const [editCategoryNameInput, setEditCategoryNameInput] = useState<string>('');
  const [editMerchantInput, setEditMerchantInput] = useState('');
  const [editNoteInput, setEditNoteInput] = useState('');
  const [editDateInput, setEditDateInput] = useState<Date | undefined>(undefined);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function checkBudgetAlert(categoryId: string, categoryName: string, newAmount: number) {
    if (!settings?.budgetAlerts) return;
    
    try {
      const [budgetsData, expensesData] = await Promise.all([
        apiFetch('/api/budgets'),
        apiFetch('/api/expenses')
      ]);
      
      const budgets = budgetsData?.items || [];
      const allExpenses = expensesData?.items || [];

      // Find budget by category ID
      const budget = budgets.find((b: any) => b.categoryId === categoryId);
      if (!budget) return;

      const now = new Date();
      // Filter expenses by category ID, not name
      const thisMonthExpenses = allExpenses.filter((e: any) => {
        const expDate = new Date(e.expenseDate || e.createdAt);
        return expDate.getMonth() === now.getMonth() && 
               expDate.getFullYear() === now.getFullYear() &&
               e.category === categoryId;
      });

      const totalSpent = thisMonthExpenses.reduce((sum: number, e: any) => sum + (e.amountCents / 100), 0) + newAmount;
      const budgetAmount = budget.amountCents / 100;
      const percentage = (totalSpent / budgetAmount) * 100;

      if (percentage >= 100) {
        toast.error(`Budget Exceeded!`, {
          description: `You've exceeded your ${categoryName} budget by ${formatCurrency(Math.abs(budgetAmount - totalSpent), currency)}`
        });
      } else if (percentage >= 80) {
        toast.warning(`Budget Warning`, {
          description: `You've used ${percentage.toFixed(0)}% of your ${categoryName} budget`
        });
      }
    } catch (e) {
      console.error('Failed to check budget:', e);
    }
  }

  function mapServerCategory(sc: ServerCategory): Category {
    // Map category names to colors and icons
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

    // Try to match by name (lowercase, remove special chars)
    const normalized = sc.name.toLowerCase().replace(/[^a-z]/g, '');
    let categoryStyle = categoryMap[normalized];
    
    // If no match, try to find in default categories
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

  function mapServerExpense(se: ServerExpense, cats: Category[]): UiExpense {
    // se.category is actually the category ID, not the name
    const match = cats.find(c => c.id === se.category);
    const fallback = defaultCategories[defaultCategories.length - 1]; // "Other" category
    const category = match ?? { ...fallback, id: se.category, name: se.category };

    return {
      id: se.id,
      amount: se.amountCents / 100,
      currency: (se.currency as Currency) ?? 'ILS',
      category,
      categoryId: category.id,
      date: new Date(se.expenseDate ?? se.createdAt),
      merchant: se.merchant ?? '',
      note: se.note ?? undefined,
      paymentMethod: undefined,
      createdAt: new Date(se.createdAt),
      updatedAt: new Date(se.createdAt),
    };
  }

  async function fetchCategories() {
    try {
      const data = await apiFetch('/api/categories');
      const items: ServerCategory[] = Array.isArray(data?.items) ? data.items : [];
      const mapped = items.map(mapServerCategory);
      setCategories(mapped.length ? mapped : defaultCategories);
    } catch (e: any) {
      setCategories(defaultCategories);
    }
  }

  async function fetchExpenses(cats?: Category[]) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/expenses');
      const items: ServerExpense[] = Array.isArray(data?.items) ? data.items : [];
      const catsToUse = cats ?? categories;
      const mapped = items.map(se => mapServerExpense(se, catsToUse));
      setExpenses(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load categories, then expenses to ensure mapping colors
    (async () => {
      try {
        const data = await apiFetch('/api/categories');
        const items: ServerCategory[] = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.map(mapServerCategory);
        const cats = mapped.length ? mapped : defaultCategories;
        setCategories(cats);
        await fetchExpenses(cats);
      } catch (e: any) {
        setCategories(defaultCategories);
        await fetchExpenses(defaultCategories);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch =
        expense.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory =
        categoryFilter === 'all' || expense.categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter, expenses]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  function openAdd() {
    setError(null);
    setEditOpen(false);
    setDeleteOpen(false);
    setAmountInput('');
    setCategoryNameInput('');
    setMerchantInput('');
    setNoteInput('');
    setDateInput(undefined);
    setAddOpen(true);
  }

  async function createExpense() {
    const amount = parseFloat(amountInput);
    const amountCents = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
    const categoryId = categoryNameInput.trim(); // This is actually the category ID
    const merchant = merchantInput.trim();
    const note = noteInput.trim();
    const expenseDate = dateInput ? dateInput.toISOString() : new Date().toISOString();

    if (!amountCents) {
      setError('Amount must be a positive number');
      return;
    }
    if (!categoryId) {
      setError('Category is required');
      return;
    }

    // Find category name for alert
    const categoryObj = categories.find(c => c.id === categoryId);
    const categoryName = categoryObj?.name || categoryId;

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amountCents,
          currency,
          category: categoryId,
          merchant: merchant || null,
          note: note || null,
          expenseDate,
        }),
      });
      setAddOpen(false);
      await fetchExpenses();
      checkBudgetAlert(categoryId, categoryName, amount);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(expense: UiExpense) {
    setError(null);
    setDeleteOpen(false);
    setEditId(expense.id);
    setEditAmountInput(String(expense.amount));
    setEditCategoryNameInput(expense.category.id);
    setEditMerchantInput(expense.merchant || '');
    setEditNoteInput(expense.note || '');
    setEditDateInput(expense.date ? new Date(expense.date) : undefined);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editId) return;

    const payload: any = {};
    const amount = parseFloat(editAmountInput);
    if (!Number.isNaN(amount) && amount > 0) payload.amountCents = Math.round(amount * 100);

    const cat = editCategoryNameInput.trim();
    if (cat) payload.category = cat;

    const merch = editMerchantInput.trim();
    if (merch) payload.merchant = merch;
    else if (editMerchantInput === '') payload.merchant = null;

    const note = editNoteInput.trim();
    if (note) payload.note = note;
    else if (editNoteInput === '') payload.note = null;

    if (editDateInput) {
      payload.expenseDate = editDateInput.toISOString();
    }

    if (Object.keys(payload).length === 0) {
      setError('No fields to update');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/expenses/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      setEditId(null);
      await fetchExpenses();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  }

  function openDelete(expense: UiExpense) {
    setError(null);
    setEditOpen(false);
    setDeleteId(expense.id);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setDeleteId(null);
      await fetchExpenses();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Expenses
            </h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
            <p className="text-muted-foreground">
              Manage and track all your expenses
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setError(null);
                try {
                  const text = await file.text();
                  const rows = parseCsv(text);
                  let success = 0;
                  let failed = 0;
                  for (const r of rows) {
                    const amountStr = (r.amount ?? '').trim();
                    const categoryName = (r.category ?? '').trim();
                    if (!amountStr || !categoryName) { failed++; continue; }
                    const amount = parseFloat(amountStr);
                    const amountCents = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
                    if (!amountCents) { failed++; continue; }
                    const currency = ((r.currency ?? '').trim() || 'ILS');
                    const merchant = ((r.merchant ?? '').trim() || null);
                    const note = ((r.note ?? '').trim() || null);
                    const expenseDateRaw = (r.expenseDate ?? '').trim();
                    const expenseDate = expenseDateRaw ? new Date(expenseDateRaw) : new Date();
                    try {
                      const res = await fetch(`${API_BASE}/api/expenses`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amountCents, currency, category: categoryName, merchant, note, expenseDate }),
                      });
                      if (!res.ok) { failed++; continue; }
                      success++;
                    } catch {
                      failed++;
                    }
                  }
                  await fetchExpenses();
                  if (failed > 0) {
                    setError(`Imported ${success} item(s). ${failed} row(s) failed.`);
                  }
                } catch (e: any) {
                  setError(e?.message ?? 'Failed to import CSV');
                } finally {
                  setImporting(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing || exporting}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExporting(true);
                setError(null);
                try {
                  const csv = buildCsv(paginatedExpenses);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const today = new Date();
                  const fn = `expenses-${today.toISOString().split('T')[0]}.csv`;
                  a.href = url;
                  a.download = fn;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (e: any) {
                  setError(e?.message ?? 'Failed to export CSV');
                } finally {
                  setExporting(false);
                }
              }}
              disabled={importing || exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Amount (e.g. 49.99)"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createExpense();
                }}
              />
              <Select
                value={categoryNameInput}
                onValueChange={(value) => setCategoryNameInput(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Merchant"
                value={merchantInput}
                onChange={(e) => setMerchantInput(e.target.value)}
              />
              <Input
                placeholder="Note (optional)"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateInput && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateInput ? format(dateInput, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateInput}
                    onSelect={setDateInput}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={createExpense} disabled={submitting || !amountInput.trim() || !categoryNameInput.trim()}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by merchant or note..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select 
                value={categoryFilter} 
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filteredExpenses.length} expenses</span>
          <span>•</span>
          <span className="font-mono-numbers font-medium text-foreground">
            {formatCurrency(totalFiltered, currency)} total
          </span>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          <p className="font-medium">No expenses found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id} className="group">
                        <TableCell className="font-medium">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.merchant}</p>
                            {expense.note && (
                              <p className="text-xs text-muted-foreground truncate max-w-48">
                                {expense.note}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="gap-1.5"
                            style={{ 
                              borderColor: expense.category.color,
                              color: expense.category.color 
                            }}
                          >
                            <div 
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: expense.category.color }}
                            />
                            {expense.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {expense.paymentMethod ? expense.paymentMethod.replace('_', ' ') : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono-numbers font-semibold">
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(expense)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(expense)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Amount (e.g. 49.99)"
                value={editAmountInput}
                onChange={(e) => setEditAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                }}
              />
              <Select
                value={editCategoryNameInput}
                onValueChange={(value) => setEditCategoryNameInput(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Merchant"
                value={editMerchantInput}
                onChange={(e) => setEditMerchantInput(e.target.value)}
              />
              <Input
                placeholder="Note (optional)"
                value={editNoteInput}
                onChange={(e) => setEditNoteInput(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDateInput && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDateInput ? format(editDateInput, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDateInput}
                    onSelect={setEditDateInput}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
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

function escapeCsvValue(value: string): string {
  if (value === undefined || value === null) return '';
  const hasSpecial = /[",\n\r]/.test(value);
  let v = value.replace(/\r/g, '').replace(/\n/g, ' ');
  if (hasSpecial) {
    v = '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function buildCsv(items: UiExpense[]): string {
  const header = 'amount,currency,category,merchant,note,expenseDate';
  const lines = items.map((e) => {
    const amount = (Number.isFinite(e.amount) ? e.amount : 0).toFixed(2);
    const currency = e.currency || 'ILS';
    const category = e.category?.name || '';
    const merchant = e.merchant || '';
    const note = e.note || '';
    const dateStr = new Date(e.date).toISOString().split('T')[0];
    return [amount, currency, category, merchant, note, dateStr]
      .map((v) => escapeCsvValue(String(v)))
      .join(',');
  });
  return [header, ...lines].join('\n');
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[] = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur.length > 0) rows.push(cur);
      cur = '';
      // consume \r\n sequences
      if (ch === '\r' && text[i + 1] === '\n') i++;
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.length > 0) rows.push(cur);

  if (rows.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let buf = '';
    let j = 0;
    let q = false;
    while (j < line.length) {
      const c = line[j];
      if (c === '"') {
        if (q && line[j + 1] === '"') {
          buf += '"';
          j += 2;
          continue;
        }
        q = !q;
        j++;
        continue;
      }
      if (c === ',' && !q) {
        out.push(buf);
        buf = '';
        j++;
        continue;
      }
      buf += c;
      j++;
    }
    out.push(buf);
    return out.map((s) => s.trim());
  };

  const header = parseLine(rows[0]).map((h) => h.toLowerCase());
  const records: Array<Record<string, string>> = [];
  for (let k = 1; k < rows.length; k++) {
    const line = rows[k].trim();
    if (!line) continue;
    const cols = parseLine(line);
    const rec: Record<string, string> = {};
    for (let h = 0; h < header.length; h++) {
      rec[header[h]] = cols[h] ?? '';
    }
    records.push(rec);
  }
  return records;
}
