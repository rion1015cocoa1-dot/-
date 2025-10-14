'use client';

import { ReactNode } from 'react';
import { YattokoProvider } from '@/hooks/yattoko-context';

export function Providers({ children }: { children: ReactNode }) {
  return <YattokoProvider>{children}</YattokoProvider>;
}
