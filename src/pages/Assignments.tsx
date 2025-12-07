import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi, vendorsApi, CustomerVendorMap, ServiceVendor } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber, formatDateTime } from '@/utils/formatters';
import { RefreshCw, Loader2 } from 'lucide-react';

export const Assignments = () => {
  const queryClient = useQueryClient();
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CustomerVendorMap | null>(null);
  const [newVendorId, setNewVendorId] = useState<string>('');

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentsApi.getAll(),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll(),
  });

  const reassignMutation = useMutation({
    mutationFn: ({ customerId, vendorId }: { customerId: number; vendorId: number }) =>
      assignmentsApi.reassign(customerId, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'Success', description: 'Customer reassigned successfully' });
      handleCloseReassign();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reassign customer', variant: 'destructive' });
    },
  });

  const assignments = assignmentsData?.data?.data || [];
  const vendors = vendorsData?.data?.data || [];

  const handleOpenReassign = (assignment: CustomerVendorMap) => {
    setSelectedAssignment(assignment);
    setNewVendorId('');
    setIsReassignOpen(true);
  };

  const handleCloseReassign = () => {
    setIsReassignOpen(false);
    setSelectedAssignment(null);
    setNewVendorId('');
  };

  const handleReassign = () => {
    if (selectedAssignment && newVendorId) {
      reassignMutation.mutate({
        customerId: selectedAssignment.customer.id,
        vendorId: parseInt(newVendorId),
      });
    }
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    {
      key: 'customer',
      header: 'Customer',
      render: (item: CustomerVendorMap) => (
        <div>
          <p className="font-medium">{item.customer?.customerName || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">
            {item.customer?.phoneNumber ? formatPhoneNumber(item.customer.phoneNumber) : 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Assigned Vendor',
      render: (item: CustomerVendorMap) => (
        <div>
          <p className="font-medium">{item.vendor?.vendorName || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{item.vendor?.centerName || ''}</p>
        </div>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned Date',
      render: (item: CustomerVendorMap) =>
        item.assignedAt ? formatDateTime(item.assignedAt) : 'N/A',
    },
    { key: 'assignedBy', header: 'Assigned By' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: CustomerVendorMap) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenReassign(item)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reassign
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Customer Assignments"
        description="Manage customer-vendor assignments"
      />

      <DataTable
        data={assignments}
        columns={columns}
        searchKey="customer"
        searchPlaceholder="Search assignments..."
        isLoading={isLoading}
        emptyMessage="No assignments found"
        pageSize={20}
      />

      {/* Reassign Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{selectedAssignment?.customer?.customerName}</p>
              <p className="text-sm text-muted-foreground">
                Current Vendor: {selectedAssignment?.vendor?.vendorName}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Select New Vendor</Label>
              <Select value={newVendorId} onValueChange={setNewVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors
                    .filter((v) => v.id !== selectedAssignment?.vendor?.id)
                    .map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.vendorName} - {vendor.centerName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseReassign}>
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!newVendorId || reassignMutation.isPending}
            >
              {reassignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
