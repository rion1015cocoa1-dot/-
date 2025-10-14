'use client';

import { Task } from '@/models/types';

type ReminderType = '48h' | 'day-of' | '1h';

const REMINDER_MESSAGES: Record<ReminderType, string> = {
  '48h': '締切まであと48時間です。',
  'day-of': '今日が締切日です。',
  '1h': '1時間後に締切です。'
};

export function scheduleReminders(task: Task, enabled: boolean) {
  if (!enabled || !task.due_at || typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  const due = new Date(task.due_at);
  const now = new Date();
  const morningOf = new Date(task.due_at);
  morningOf.setHours(9, 0, 0, 0);

  const schedule: Array<{ diff: number; type: ReminderType }> = [
    { diff: due.getTime() - 48 * 60 * 60 * 1000 - now.getTime(), type: '48h' },
    { diff: morningOf.getTime() - now.getTime(), type: 'day-of' },
    { diff: due.getTime() - 60 * 60 * 1000 - now.getTime(), type: '1h' }
  ];

  schedule.forEach(({ diff, type }) => {
    if (diff > 0) {
      window.setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('ヤットコ！', {
            body: REMINDER_MESSAGES[type]
          });
        }
      }, diff);
    }
  });
}
