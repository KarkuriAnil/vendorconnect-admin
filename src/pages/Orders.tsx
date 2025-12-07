import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, vendorsApi, PurchaseOrder } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDateTime, toISODateString } from '@/utils/formatters';
import { Download, Eye, CalendarIcon, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', startDate, endDate],
    queryFn: () => {
      if (startDate && endDate) {
        return ordersApi.getByDateRange(
          toISODateString(startDate),
          toISODateString(endDate)
        );
      }
      return ordersApi.getAll();
    },
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll(),
  });

  const orders = ordersData?.data?.data || [];
  const vendors = vendorsData?.data?.data || [];

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (paymentStatusFilter !== 'all' && order.paymentStatus !== paymentStatusFilter) return false;
    if (vendorFilter !== 'all' && order.vendor?.id?.toString() !== vendorFilter) return false;
    return true;
  });

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Date Range Required',
        description: 'Please select both start and end dates to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      await ordersApi.export(toISODateString(startDate), toISODateString(endDate));
      toast({ title: 'Success', description: 'Orders exported successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export orders', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setVendorFilter('all');
  };

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (item: PurchaseOrder) => (
        <span className="font-mono font-medium">{item.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (item: PurchaseOrder) => item.customer?.customerName || 'N/A',
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (item: PurchaseOrder) => item.vendor?.vendorName || 'N/A',
    },
    {
      key: 'item',
      header: 'Item',
      render: (item: PurchaseOrder) => (
        <div>
          <p>{item.item?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Amount',
      sortable: true,
      render: (item: PurchaseOrder) => formatCurrency(item.totalPrice),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (item: PurchaseOrder) => (
        <div>
          <p className="text-sm">
            {item.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'Razorpay'}
          </p>
          <StatusBadge status={item.paymentStatus} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: PurchaseOrder) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (item: PurchaseOrder) =>
        item.createdAt ? formatDateTime(item.createdAt) : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: PurchaseOrder) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleViewDetails(item)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Orders"
        description="View and manage all orders"
        action={
          <Button onClick={handleExport} disabled={isExporting || !startDate || !endDate}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 rounded-xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            Clear All
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Order Status */}
          <div className="space-y-2">
            <Label>Order Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredOrders}
        columns={columns}
        searchKey="orderNumber"
        searchPlaceholder="Search by order number..."
        isLoading={isLoading}
        emptyMessage="No orders found"
        pageSize={20}
      />

      {/* Order Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-mono text-lg font-semibold">{selectedOrder.orderNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer?.customerName || 'N/A'}</p>
                  <p className="text-sm">{selectedOrder.customer?.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedOrder.vendor?.vendorName || 'N/A'}</p>
                  <p className="text-sm">{selectedOrder.vendor?.centerName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Item Details</p>
                <div className="rounded-lg border p-3">
                  <p className="font-medium">{selectedOrder.item?.name}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Unit Price: {formatCurrency(selectedOrder.unitPrice)}</span>
                    <span>Qty: {selectedOrder.quantity}</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-primary">
                    Total: {formatCurrency(selectedOrder.totalPrice)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <StatusBadge status={selectedOrder.status} className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <StatusBadge status={selectedOrder.paymentStatus} className="mt-1" />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {selectedOrder.paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'Cash on Delivery'
                    : 'Razorpay'}
                </p>
              </div>

              {selectedOrder.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>Created: {selectedOrder.createdAt ? formatDateTime(selectedOrder.createdAt) : 'N/A'}</p>
                <p>Updated: {selectedOrder.updatedAt ? formatDateTime(selectedOrder.updatedAt) : 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
