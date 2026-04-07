import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Wallet, CreditCard, Receipt, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency as formatCurrencyLib } from '@/lib/format';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: 'wallet' | 'credit' | 'receipt' | 'target';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  delay?: number;
}

const iconMap = {
  wallet: Wallet,
  credit: CreditCard,
  receipt: Receipt,
  target: Target,
};

export function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel = 'vs last month',
  icon, 
  trend,
  className,
  delay = 0
}: StatCardProps) {
  const Icon = iconMap[icon];
  const isPositive = trend === 'up' || (change !== undefined && change > 0);
  const isNegative = trend === 'down' || (change !== undefined && change < 0);

  return (
    <Card 
      variant="default" 
      className={cn(
        "animate-fade-in-up opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono-numbers">{value}</div>
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={cn(
              "flex items-center gap-0.5 font-medium",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : isNegative ? (
                <ArrowDown className="h-3 w-3" />
              ) : null}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
  monthlyChange: number;
  monthlyBudget?: number;
  currency?: string;
}

export function StatsGrid({ totalExpenses, expenseCount, averageExpense, monthlyChange, monthlyBudget = 0, currency = 'ILS' }: StatsGridProps) {
  const budgetValue = monthlyBudget > 0 ? monthlyBudget : 2500;
  const remaining = budgetValue - totalExpenses;
  const remainingPercent = budgetValue > 0 ? (remaining / budgetValue) * 100 : 0;
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Expenses"
        value={formatCurrencyLib(totalExpenses, currency)}
        change={monthlyChange}
        icon="wallet"
        trend={monthlyChange > 0 ? 'up' : 'down'}
        delay={0}
      />
      <StatCard
        title="Transactions"
        value={expenseCount}
        icon="receipt"
        delay={100}
      />
      <StatCard
        title="Average Expense"
        value={formatCurrencyLib(averageExpense, currency)}
        icon="credit"
        delay={200}
      />
      <StatCard
        title="Monthly Budget"
        value={formatCurrencyLib(budgetValue, currency)}
        change={remainingPercent}
        changeLabel="remaining"
        icon="target"
        delay={300}
      />
    </div>
  );
}
