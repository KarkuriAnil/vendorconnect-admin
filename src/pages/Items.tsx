import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, ProductItem } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Items = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    mrp: '',
    genPrice: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ProductItem>) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item created successfully' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create item', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductItem> }) =>
      itemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item updated successfully' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item deleted successfully' });
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    },
  });

  const items = data?.data?.data || [];

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', imageUrl: '', mrp: '', genPrice: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: ProductItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      imageUrl: item.imageUrl || '',
      mrp: item.mrp.toString(),
      genPrice: item.genPrice.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', imageUrl: '', mrp: '', genPrice: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      imageUrl: formData.imageUrl || undefined,
      mrp: parseFloat(formData.mrp),
      genPrice: parseFloat(formData.genPrice),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item: ProductItem) => (
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'mrp',
      header: 'MRP',
      sortable: true,
      render: (item: ProductItem) => formatCurrency(item.mrp),
    },
    {
      key: 'genPrice',
      header: 'Gen Price',
      sortable: true,
      render: (item: ProductItem) => formatCurrency(item.genPrice),
    },
    {
      key: 'active',
      header: 'Status',
      render: (item: ProductItem) => (
        <Badge variant={item.active ? 'default' : 'secondary'}>
          {item.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ProductItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(item)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <DataTable
        data={items}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search products..."
        isLoading={isLoading}
        emptyMessage="No products found"
        pageSize={20}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹) *</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genPrice">Gen Price (₹) *</Label>
                <Input
                  id="genPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.genPrice}
                  onChange={(e) => setFormData({ ...formData, genPrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </MainLayout>
  );
};
