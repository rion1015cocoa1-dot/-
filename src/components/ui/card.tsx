import { cn } from '@/utils/cn';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-md',
        className
      )}
      {...props}
    />
  );
}
