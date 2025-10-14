'use client';

import { useMemo, useState } from 'react';
import { useYattoko } from '@/hooks/yattoko-context';
import { TaskInput } from '@/components/tasks/task-input';
import { TaskList } from '@/components/tasks/task-list';
import { GoalCard } from '@/components/goals/goal-card';
import { TimelineFeed } from '@/components/timeline/timeline-feed';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { deriveGoalSuggestions } from '@/utils/suggestions';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

const tabs = ['今日', 'ゴール', 'タイムライン', '設定'] as const;

type Tab = (typeof tabs)[number];

export default function HomePage() {
  const {
    tasks,
    addTask,
    toggleTaskStatus,
    goals,
    habits,
    checkins,
    user,
    isOffline,
    setOffline,
    lastLoginLabel,
    lastSyncAt
  } = useYattoko();
  const [tab, setTab] = useState<Tab>('今日');

  const lastLoginDiff = user.last_login_at ? Date.now() - new Date(user.last_login_at).getTime() : 0;

  const suggestions = useMemo(() => deriveGoalSuggestions(tasks), [tasks]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'done'), [tasks]);

  const goalNudges = useMemo(() => {
    if (user.plan === 'free') {
      const remainingGoals = Math.max(0, 1 - goals.length);
      const remainingHabits = goals.length ? Math.max(0, 3 - habits.filter((h) => h.goal_id === goals[0].id).length) : 3;
      const remainingUnlinked = Math.max(0, 10 - tasks.filter((task) => !task.goal_id).length);
      return {
        goal: remainingGoals,
        habit: remainingHabits,
        task: remainingUnlinked
      };
    }
    return null;
  }, [goals, habits, tasks, user.plan]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-24 pt-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">ヤットコ！</h1>
            <p className="text-sm text-rose-500">もう後悔とはサヨナラ！</p>
            <p className="text-sm text-slate-500">
              小さな"今日やること"から始めよう。それが、いつのまにか"あなたのゴール"になる。
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
            {user.motivationBoostEnabled ? lastLoginLabel : 'モチベブーストOFF'}
            <button
              type="button"
              className="text-rose-400 underline"
              onClick={() => setOffline(!isOffline)}
            >
              {isOffline ? 'オンラインに戻す' : 'オフラインをシミュレート'}
            </button>
          </div>
        </div>
        <OfflineIndicator offline={isOffline} lastSyncAt={lastSyncAt} />
        {lastLoginDiff > 7 * 24 * 60 * 60 * 1000 && user.motivationBoostEnabled && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-semibold text-rose-600">
            おかえり！また少しずつ再開しよう
          </div>
        )}
        <nav className="flex gap-2 overflow-auto rounded-3xl bg-white/60 p-2 shadow-sm">
          {tabs.map((item) => (
            <Button
              key={item}
              variant={item === tab ? 'primary' : 'ghost'}
              onClick={() => setTab(item)}
              className="flex-1 whitespace-nowrap"
            >
              {item}
            </Button>
          ))}
        </nav>
      </header>

      {tab === '今日' && (
        <section className="space-y-6">
          <TaskInput onAdd={addTask} />
          {goalNudges && (
            <div className="rounded-3xl border border-dashed border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-600">
              無料プランはゴール1件まで（あと{goalNudges.goal}件）。プレミアムで無制限に。
              <br />ゴールごとの習慣はあと{goalNudges.habit}件まで追加できます。
              <br />未リンクのタスクはあと{goalNudges.task}件追加できます。
            </div>
          )}
          {suggestions.map((suggestion) => (
            <div key={suggestion.message} className="rounded-3xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-rose-600">スマート提案</p>
              <p className="mt-1 text-sm text-slate-600">{suggestion.message}</p>
              <div className="mt-3 flex gap-2">
                <Button>あとで考える</Button>
                <Button variant="ghost">今すぐ作る</Button>
              </div>
            </div>
          ))}
          <div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">今日のやること</h2>
            <TaskList tasks={tasks} onToggle={toggleTaskStatus} />
          </div>
        </section>
      )}

      {tab === 'ゴール' && (
        <section className="space-y-4">
          {goals.length === 0 && (
            <div className="rounded-3xl border border-dashed border-rose-300 bg-rose-50/70 p-6 text-center text-sm text-slate-600">
              まずはゴールを作ってみましょう。タスクから自然に生まれてきます。
            </div>
          )}
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} habits={habits.filter((habit) => habit.goal_id === goal.id)} tasks={tasks} />
          ))}
        </section>
      )}

      {tab === 'タイムライン' && (
        <section className="space-y-4">
          <TimelineFeed completedTasks={completedTasks} checkins={checkins} />
        </section>
      )}

      {tab === '設定' && (
        <section className="space-y-4">
          <SettingsPanel />
        </section>
      )}
    </main>
  );
}
