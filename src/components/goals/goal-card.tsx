'use client';

import { Goal, Habit, Task } from '@/models/types';
import { Card } from '@/components/ui/card';
import { formatDeadline } from '@/utils/date';

interface GoalCardProps {
  goal: Goal;
  habits: Habit[];
  tasks: Task[];
}

function calculateCompletion(tasks: Task[], range: 'weekly' | 'monthly') {
  const now = new Date();
  const start = new Date(now);
  if (range === 'weekly') {
    start.setDate(now.getDate() - 6);
  } else {
    start.setDate(now.getDate() - 29);
  }
  const completed = tasks.filter((task) => task.completed_at && new Date(task.completed_at) >= start).length;
  const total = Math.max(tasks.length, 1);
  return Math.min(100, Math.round((completed / total) * 100));
}

function CompletionRing({ value }: { value: number }) {
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 36 36" className="h-full w-full">
        <path
          className="fill-none stroke-rose-100"
          strokeWidth="3"
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        />
        <path
          className="fill-none stroke-brand"
          strokeDasharray={`${value}, 100`}
          strokeWidth="3"
          strokeLinecap="round"
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-brand">{value}%</div>
    </div>
  );
}

export function GoalCard({ goal, habits, tasks }: GoalCardProps) {
  const weekly = calculateCompletion(tasks.filter((task) => task.goal_id === goal.id), 'weekly');
  const monthly = calculateCompletion(tasks.filter((task) => task.goal_id === goal.id), 'monthly');

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">ゴール</p>
          <h3 className="text-2xl font-bold text-slate-900">{goal.title}</h3>
          <p className="mt-1 text-sm text-slate-500">締切：{formatDeadline(goal.deadline, 'Asia/Tokyo')}</p>
        </div>
        <CompletionRing value={weekly} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-rose-50/80 p-4">
          <p className="text-sm font-semibold text-rose-600">今週の達成率</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{weekly}%</p>
        </div>
        <div className="rounded-2xl bg-rose-50/80 p-4">
          <p className="text-sm font-semibold text-rose-600">今月の達成率</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{monthly}%</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">このゴールを支える習慣</p>
        <ul className="mt-2 space-y-2">
          {habits.length === 0 && <li className="text-sm text-slate-500">まだ習慣はありません。</li>}
          {habits.map((habit) => (
            <li key={habit.id} className="rounded-xl bg-white/70 p-3 text-sm shadow-sm">
              <p className="font-semibold text-slate-800">{habit.title}</p>
              <p className="mt-1 text-xs text-slate-500">頻度：{habit.freq_type}</p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
