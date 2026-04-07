import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  PieChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wallet,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent onClose={() => setSidebarOpen(false)} currentPath={location.pathname} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-card lg:border-r lg:border-border">
        <SidebarContent currentPath={location.pathname} />
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Expense Tracker</span>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  currentPath: string;
  onClose?: () => void;
}

function SidebarContent({ currentPath, onClose }: SidebarContentProps) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    if (onClose) onClose();
  };
  
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Expense Tracker</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{settings?.fullName || 'Demo User'}</p>
            <p className="text-xs text-muted-foreground truncate">{settings?.email || 'demo@example.com'}</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
