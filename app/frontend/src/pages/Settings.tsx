import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Download,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { apiFetch, API_BASE, getAuthHeaders } from '@/lib/api';

interface UserSettings {
  userId: string;
  fullName: string;
  email: string;
  darkMode: boolean;
  defaultCurrency: string;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  monthlyIncomeCents: number;
  updatedAt: string;
}

const THEME_PREFERENCE_KEY = 'theme-preference';

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("ILS");
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("0");

  useEffect(() => {
    // First load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.fullName) setFullName(user.fullName);
        if (user.email) setEmail(user.email);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    
    // Then fetch settings from API
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/settings');
      const s = data.settings;
      setSettings(s);
      
      // Only update profile fields if they're not default demo values
      // This preserves the user's actual name/email from localStorage
      if (s.fullName && s.fullName !== "Demo User") {
        setFullName(s.fullName);
      }
      if (s.email && s.email !== "demo@example.com") {
        setEmail(s.email);
      }
      
      setDarkMode(s.darkMode);
      setDefaultCurrency(s.defaultCurrency);
      setBudgetAlerts(s.budgetAlerts);
      setWeeklySummary(s.weeklySummary);
      setMonthlyIncome((s.monthlyIncomeCents / 100).toFixed(2));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(overrides?: Partial<UserSettings>) {
    setSaving(true);
    setError(null);
    try {
      const monthlyIncomeCents = Math.round(parseFloat(monthlyIncome) * 100);
      
      const payload = {
        fullName: overrides?.fullName ?? fullName,
        email: overrides?.email ?? email,
        darkMode: overrides?.darkMode ?? darkMode,
        defaultCurrency: overrides?.defaultCurrency ?? defaultCurrency,
        budgetAlerts: overrides?.budgetAlerts ?? budgetAlerts,
        weeklySummary: overrides?.weeklySummary ?? weeklySummary,
        monthlyIncomeCents: overrides?.monthlyIncomeCents ?? monthlyIncomeCents,
      };
      
      const data = await apiFetch('/api/settings', {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      
      setSettings(data.settings);
      
      // Update local state with saved values
      setFullName(data.settings.fullName);
      setEmail(data.settings.email);
      setDarkMode(data.settings.darkMode);
      setDefaultCurrency(data.settings.defaultCurrency);
      setBudgetAlerts(data.settings.budgetAlerts);
      setWeeklySummary(data.settings.weeklySummary);
      setMonthlyIncome((data.settings.monthlyIncomeCents / 100).toFixed(2));
      
      document.documentElement.classList.toggle('dark', data.settings.darkMode);
      localStorage.setItem(THEME_PREFERENCE_KEY, data.settings.darkMode ? 'dark' : 'light');
      
      // Refresh global settings context
      await refreshSettings();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to export data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? "Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  async function clearAllData() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/data/clear-all`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete data");
      setDeleteDialogOpen(false);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete data");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading settings...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {/* Profile Section */}
        <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <Label htmlFor="monthlyIncome">Monthly Income (₪)</Label>
              </div>
              <Input
                id="monthlyIncome"
                type="number"
                step="0.01"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                onBlur={() => saveSettings()}
                placeholder="0.00"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Enter your monthly income. This field auto-saves and updates your budget in the dashboard
              </p>
            </div>
            
            <Separator />
            
            <Button onClick={() => saveSettings()} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme across the app
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => {
                  setDarkMode(checked);
                  saveSettings({ darkMode: checked });
                }}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={defaultCurrency}
                onValueChange={(value) => {
                  setDefaultCurrency(value);
                  saveSettings({ defaultCurrency: value });
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="ILS">ILS (₪)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure when you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Budget Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when approaching budget limits
                </p>
              </div>
              <Switch
                checked={budgetAlerts}
                onCheckedChange={(checked) => {
                  setBudgetAlerts(checked);
                  saveSettings({ budgetAlerts: checked });
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary <span className="text-xs text-muted-foreground">(Coming Soon)</span></Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly expense summary
                </p>
              </div>
              <Switch
                checked={weeklySummary}
                onCheckedChange={(checked) => {
                  setWeeklySummary(checked);
                  saveSettings({ weeklySummary: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Section */}
        <Card className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Data & Privacy</CardTitle>
            </div>
            <CardDescription>
              Manage your data and account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="outline" onClick={exportData} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export All Data"}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your expenses, categories, and budgets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAllData} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
