import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategorySummary } from '@/types/expense';
import { formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  showBudget?: boolean;
  currency?: string;
}

export function CategoryBreakdown({ categories, showBudget = true, currency = 'ILS' }: CategoryBreakdownProps) {
  const topCategories = categories.filter(c => c.total > 0).slice(0, 6);

  return (
    <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses this month
          </p>
        ) : (
          topCategories.map((item) => (
            <div key={item.category.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.category.color }}
                  />
                  <span className="font-medium">{item.category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-numbers font-medium">
                    {formatCurrency(item.total, currency)}
                  </span>
                  <span className="text-muted-foreground text-xs w-10 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2"
                style={{ 
                  // @ts-ignore - Custom CSS property
                  '--progress-color': item.category.color 
                } as React.CSSProperties}
              />
              {showBudget && item.budget && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Budget: {formatCurrency(item.budget, currency)}</span>
                  <span className={cn(
                    item.budgetUsed && item.budgetUsed > 100 && "text-destructive",
                    item.budgetUsed && item.budgetUsed > 80 && item.budgetUsed <= 100 && "text-warning"
                  )}>
                    {item.budgetUsed?.toFixed(0)}% used
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
