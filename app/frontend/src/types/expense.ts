export type Currency = 'USD' | 'EUR' | 'GBP' | 'ILS' | 'JPY';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'other';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  categoryId: string;
  date: Date;
  merchant: string;
  note?: string;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  currency: Currency;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilters {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  paymentMethod?: PaymentMethod;
}

export interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
  topCategory: Category | null;
  monthlyChange: number;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
  budget?: number;
  budgetUsed?: number;
}

export interface DailyExpense {
  date: string;
  total: number;
  count: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}
