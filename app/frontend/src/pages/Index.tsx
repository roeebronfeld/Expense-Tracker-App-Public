import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap,
  PieChart,
  CreditCard,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Beautiful charts and graphs to understand your spending patterns at a glance.',
  },
  {
    icon: PieChart,
    title: 'Category Budgets',
    description: 'Set monthly budgets for each category and get alerts before overspending.',
  },
  {
    icon: CreditCard,
    title: 'Multi-Payment Tracking',
    description: 'Track cash, cards, and digital payments all in one unified dashboard.',
  },
  {
    icon: Zap,
    title: 'Fast & Responsive',
    description: 'Lightning-fast interface that works seamlessly on desktop and mobile.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Your financial data is encrypted and protected with industry standards.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Insights',
    description: 'AI-powered insights to help you save more and spend wisely.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Expense Tracker</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="glow" className="mb-6 animate-fade-in">
              <Zap className="h-3 w-3 mr-1" />
              Production-Ready SaaS
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up">
              Take Control of Your{' '}
              <span className="text-gradient">Financial Future</span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              Track expenses, set budgets, and gain insights into your spending habits 
              with our modern, intuitive expense tracking platform.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <Link to="/dashboard">
                <Button size="xl" className="glow-primary">
                  Start Tracking Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="xl" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to Track Expenses
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to give you complete control over your finances.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                variant="interactive"
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card variant="glow" className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Ready to Take Control?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of users who have transformed their financial habits 
                  with Expense Tracker.
                </p>
                <Link to="/dashboard">
                  <Button size="lg" className="glow-primary">
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Expense Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Expense Tracker. Built for DevOps practice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
