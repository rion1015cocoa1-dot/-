import { cn } from '@/utils/cn';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600',
        className
      )}
      {...props}
    />
  );
}
