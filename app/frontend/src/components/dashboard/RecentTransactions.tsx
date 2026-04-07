import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/types/expense';
import { formatCurrency, formatRelativeDate } from '@/lib/mock-data';
import { CreditCard, Banknote, Smartphone, Building2, Bitcoin, MoreHorizontal } from 'lucide-react';

interface RecentTransactionsProps {
  expenses: Expense[];
  limit?: number;
  currency?: string;
}

const paymentIcons = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
  paypal: Smartphone,
  bank_transfer: Building2,
  crypto: Bitcoin,
  other: MoreHorizontal,
};

export function RecentTransactions({ expenses, limit = 5, currency = 'ILS' }: RecentTransactionsProps) {
  const recentExpenses = expenses.slice(0, limit);

  return (
    <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet
          </p>
        ) : (
          recentExpenses.map((expense) => {
            const PaymentIcon = paymentIcons[expense.paymentMethod] || MoreHorizontal;
            
            return (
              <div 
                key={expense.id} 
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div 
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${expense.category.color}20` }}
                >
                  <PaymentIcon 
                    className="h-5 w-5" 
                    style={{ color: expense.category.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{expense.merchant}</p>
                    <Badge variant="muted" className="shrink-0 text-xs">
                      {expense.category.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(expense.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold font-mono-numbers">
                    -{formatCurrency(expense.amount, expense.currency)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
