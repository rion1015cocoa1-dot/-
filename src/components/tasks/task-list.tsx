'use client';

import { useMemo, useState } from 'react';
import { Task } from '@/models/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { relativeFromNow } from '@/utils/date';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
}

const postponeOptions = [
  { label: '今夜', value: 'evening' },
  { label: '明朝', value: 'morning' },
  { label: '+1日', value: 'plus1' },
  { label: '日時をえらぶ', value: 'pick' },
  { label: 'スヌーズ1時間', value: 'snooze' }
];

export function TaskList({ tasks, onToggle }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''));
  }, [tasks]);

  const handleOption = () => {
    setSelectedTask(null);
  };

  return (
    <div className="space-y-4">
      {sorted.map((task) => {
        const isOverdue = task.due_at ? new Date(task.due_at) < new Date() && task.status !== 'done' : false;
        return (
          <div key={task.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn('text-lg font-semibold', task.status === 'done' && 'line-through text-slate-400')}>
                  {task.title}
                </p>
                {task.note && <p className="mt-1 text-sm text-slate-500">{task.note}</p>}
                {task.due_at && (
                  <p className="mt-2 text-xs text-slate-500">締切：{relativeFromNow(task.due_at)}</p>
                )}
              </div>
              <Button variant={task.status === 'done' ? 'outline' : 'primary'} onClick={() => onToggle(task.id)}>
                {task.status === 'done' ? '戻す' : '完了'}
              </Button>
            </div>
            {isOverdue && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <Badge className="bg-rose-200 text-rose-700">期限切れ</Badge>
                <Button variant="ghost" onClick={() => setSelectedTask(task)}>
                  いつやる？
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-6 text-center text-slate-600">
          まだゴールがなくても、やりたいことを1つ追加してみよう。
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">{selectedTask.title}</h3>
            <p className="mt-2 text-sm text-slate-500">いつにする？</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {postponeOptions.map((option) => (
                <Button key={option.value} variant="outline" onClick={handleOption}>
                  {option.label}
                </Button>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => setSelectedTask(null)}>
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
