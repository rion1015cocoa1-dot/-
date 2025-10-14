'use client';

import { CloudOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface OfflineIndicatorProps {
  offline: boolean;
  lastSyncAt?: number;
}

export function OfflineIndicator({ offline, lastSyncAt }: OfflineIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-dashed border-rose-200 bg-rose-50/70 px-4 py-2 text-xs text-rose-600 transition',
        offline || lastSyncAt ? 'opacity-100' : 'opacity-0'
      )}
    >
      <CloudOff size={16} />
      {offline ? (
        <span>オフラインモード（操作はあとで同期されます）</span>
      ) : (
        <span>{lastSyncAt ? `同期しました（${new Date(lastSyncAt).toLocaleTimeString('ja-JP')}）` : '接続確認中...'}</span>
      )}
    </div>
  );
}
