import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi, ServiceVendor } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber, formatDateTime } from '@/utils/formatters';
import { Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Vendors = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    centerName: '',
    phoneNumber: '',
    username: '',
    password: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({ title: 'Success', description: 'Vendor created successfully' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create vendor', variant: 'destructive' });
    },
  });

  const vendors = data?.data?.data || [];

  const handleOpenCreate = () => {
    setFormData({
      vendorName: '',
      centerName: '',
      phoneNumber: '',
      username: '',
      password: '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      vendorName: '',
      centerName: '',
      phoneNumber: '',
      username: '',
      password: '',
    });
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: true,
      render: (item: ServiceVendor) => (
        <span className="font-medium">{item.vendorName}</span>
      ),
    },
    { key: 'centerName', header: 'Center Name', sortable: true },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item: ServiceVendor) => formatPhoneNumber(item.phoneNumber),
    },
    { key: 'username', header: 'Username' },
    {
      key: 'active',
      header: 'Status',
      render: (item: ServiceVendor) => (
        <Badge variant={item.active ? 'default' : 'secondary'}>
          {item.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item: ServiceVendor) =>
        item.createdAt ? formatDateTime(item.createdAt) : 'N/A',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Vendors"
        description="Manage service vendors"
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      <DataTable
        data={vendors}
        columns={columns}
        searchKey="vendorName"
        searchPlaceholder="Search vendors..."
        isLoading={isLoading}
        emptyMessage="No vendors found"
        pageSize={20}
      />

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name *</Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="Enter vendor name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centerName">Center Name *</Label>
              <Input
                id="centerName"
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                placeholder="Enter center name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
