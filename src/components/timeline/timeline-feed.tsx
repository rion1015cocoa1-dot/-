'use client';

import { Checkin, Task } from '@/models/types';
import { Card } from '@/components/ui/card';
import { relativeFromNow } from '@/utils/date';

interface TimelineFeedProps {
  completedTasks: Task[];
  checkins: Checkin[];
}

export function TimelineFeed({ completedTasks, checkins }: TimelineFeedProps) {
  const combined = [
    ...completedTasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task' as const,
      title: `${task.title} を完了`,
      timestamp: task.completed_at ?? task.created_at
    })),
    ...checkins.map((check) => ({
      id: `check-${check.id}`,
      type: 'checkin' as const,
      title: `習慣チェックイン (${check.status})`,
      timestamp: check.date
    }))
  ].sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));

  const grouped = combined.reduce<Record<string, typeof combined>>((acc, item) => {
    const day = item.timestamp?.slice(0, 10) ?? '未記録';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const entries = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <Card className="text-center text-sm text-slate-500">まだ記録がありません。</Card>
      )}
      {entries.map(([day, items]) => (
        <Card key={day} className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{day}</p>
            <p className="text-sm text-slate-500">昨日の自分に、少し勝った。</p>
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl bg-rose-50/60 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-800">{item.title}</div>
                <div className="text-xs text-slate-500">{relativeFromNow(item.timestamp ?? new Date().toISOString())}</div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
