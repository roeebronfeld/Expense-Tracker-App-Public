import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2,
  Palette,
  MoreHorizontal
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { defaultCategories } from '@/lib/mock-data';
import { Category } from '@/types/expense';
import { apiFetch } from '@/lib/api';

export default function Categories() {
  const API_URL = import.meta.env.VITE_API_URL;

const [serverCategories, setServerCategories] = useState<{ id: string; name: string; createdAt?: string }[]>([]);
const [loading, setLoading] = useState(false);

const [addOpen, setAddOpen] = useState(false);
const [newName, setNewName] = useState('');
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

async function fetchCategories() {
  setLoading(true);
  setError(null);
  try {
    const data = await apiFetch('/api/categories');
    setServerCategories(Array.isArray(data?.items) ? data.items : []);
  } catch (e: any) {
    setError(e?.message ?? 'Failed to load categories');
    setServerCategories([]);
  } finally {
    setLoading(false);
  }
}

async function createCategory() {
  const name = newName.trim();
  if (!name) return;

  setSubmitting(true);
  setError(null);

  try {
    await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    setNewName('');
    setAddOpen(false);
    await fetchCategories();
  } catch (e: any) {
    if (e?.message?.includes('409') || e?.message?.toLowerCase().includes('already exists')) {
      setError('Category name already exists');
    } else {
      setError(e?.message ?? 'Failed to create category');
    }
  } finally {
    setSubmitting(false);
  }
}
const [editOpen, setEditOpen] = useState(false);
const [editId, setEditId] = useState<string | null>(null);
const [editName, setEditName] = useState('');

const [deleteOpen, setDeleteOpen] = useState(false);
const [deleteId, setDeleteId] = useState<string | null>(null);

function openEdit(category: Category) {
   setError(null);
  setDeleteOpen(false);
  setEditId(category.id);
  setEditName(category.name);
  setEditOpen(true);
}

async function saveEdit() {
  if (!editId) return;
  const name = editName.trim();
  if (!name) return;

  setSubmitting(true);
  setError(null);

  try {
    await apiFetch(`/api/categories/${editId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });

    setEditOpen(false);
    setEditId(null);
    setEditName('');
    await fetchCategories();
  } catch (e: any) {
    if (e?.message?.includes('409') || e?.message?.toLowerCase().includes('already exists')) {
      setError('Category name already exists');
    } else if (e?.message?.includes('404') || e?.message?.toLowerCase().includes('not found')) {
      setError('Category not found');
    } else {
      setError(e?.message ?? 'Failed to update category');
    }
  } finally {
    setSubmitting(false);
  }
}

function openDelete(category: Category) {
   setError(null);
  setEditOpen(false);
  setDeleteId(category.id);
  setDeleteOpen(true);
}

async function confirmDelete() {
  if (!deleteId) return;

  setSubmitting(true);
  setError(null);

  try {
    await apiFetch(`/api/categories/${deleteId}`, {
      method: 'DELETE',
    });

    setDeleteOpen(false);
    setDeleteId(null);
    await fetchCategories();
  } catch (e: any) {
    if (e?.message?.includes('404') || e?.message?.toLowerCase().includes('not found')) {
      setError('Category not found');
    } else {
      setError(e?.message ?? 'Failed to delete category');
    }
  } finally {
    setSubmitting(false);
  }
}

useEffect(() => {
  fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
const categories: Category[] = useMemo(() => {
  if (!serverCategories.length) return defaultCategories;

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

  return serverCategories.map((sc) => {
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
  });
}, [serverCategories]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Categories</h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary/80 to-primary/0 rounded"></div>
            <p className="text-muted-foreground">
              Organize your expenses with custom categories
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
  <Button aria-label="Add Category" className="shadow-sm focus-visible:ring-2 focus-visible:ring-primary" onClick={() => { setError(null); setAddOpen(true); }}>
    <Plus className="h-4 w-4 mr-2" />
    Add Category
  </Button>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Category</DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Category name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') createCategory();
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={createCategory} disabled={submitting || !newName.trim()}>
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Category</DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      <Input
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="Category name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") saveEdit();
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setEditOpen(false)}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button onClick={saveEdit} disabled={submitting || !editName.trim()}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this category?</AlertDialogTitle>
    </AlertDialogHeader>

    {error ? <p className="text-sm text-destructive">{error}</p> : null}

    <AlertDialogFooter>
      <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} disabled={submitting}>
        {submitting ? "Deleting..." : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Card 
              key={category.id} 
              variant="interactive"
              className="animate-fade-in-up opacity-0 border border-border/50 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-xl shadow-inner"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Palette 
                        className="h-6 w-6" 
                        style={{ color: category.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground tracking-tight">{category.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="h-3.5 w-3.5 rounded-full border-2 shadow-sm"
                          style={{ 
                            backgroundColor: category.color,
                            borderColor: category.color 
                          }}
                        />
                        <span className="sr-only">{category.color}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary" aria-label="Category actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(category)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => openDelete(category)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
