import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 'PENDING' | 'PAID' | 'FAILED' | 'DELIVERED' | 'CANCELLED' | 'PREPARING';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'status-pending' },
  PAID: { label: 'Paid', className: 'status-paid' },
  FAILED: { label: 'Failed', className: 'status-failed' },
  DELIVERED: { label: 'Delivered', className: 'status-delivered' },
  CANCELLED: { label: 'Cancelled', className: 'status-cancelled' },
  PREPARING: { label: 'Preparing', className: 'status-preparing' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border px-2.5 py-0.5 text-xs',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
