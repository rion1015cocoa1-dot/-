'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Checkin, Goal, Habit, OfflineQueueItem, PlanTier, Task, UserProfile } from '@/models/types';
import { enqueue, useOfflineQueue } from '@/services/offlineQueue';
import { scheduleReminders } from '@/services/notifications/reminders';
import { relativeLastLogin } from '@/utils/date';

interface YattokoState {
  user: UserProfile;
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  checkins: Checkin[];
  isOffline: boolean;
  offlineQueue: OfflineQueueItem[];
  lastSyncAt?: number;
  addTask: (task: Partial<Task>) => void;
  toggleTaskStatus: (id: string) => void;
  linkTaskToGoal: (taskId: string, goalId?: string | null) => void;
  addGoal: (goal: Partial<Goal>) => void;
  addHabit: (habit: Partial<Habit>) => void;
  recordCheckin: (habitId: string, date: string, status: Checkin['status']) => void;
  setOffline: (offline: boolean) => void;
  switchPlan: (plan: PlanTier) => void;
  updateMotivationBoost: (enabled: boolean) => void;
  updateReminders: (enabled: boolean) => void;
  completeSync: () => void;
  lastLoginLabel: string;
}

const STORAGE_KEY = 'yattoko_state_v1';

const defaultUser: UserProfile = {
  id: 'demo-user',
  plan: 'free',
  tz: 'Asia/Tokyo',
  notify_prefs: {
    remindersEnabled: true
  },
  last_login_at: new Date().toISOString(),
  motivationBoostEnabled: true
};

const defaultState: Omit<YattokoState, 'addTask' | 'toggleTaskStatus' | 'linkTaskToGoal' | 'addGoal' | 'addHabit' | 'recordCheckin' | 'setOffline' | 'switchPlan' | 'updateMotivationBoost' | 'updateReminders' | 'completeSync' | 'lastLoginLabel'> = {
  user: defaultUser,
  tasks: [],
  goals: [],
  habits: [],
  checkins: [],
  isOffline: false,
  offlineQueue: []
};

const YattokoContext = createContext<YattokoState | undefined>(undefined);

function loadPersistedState(): typeof defaultState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as typeof defaultState) : null;
  } catch (error) {
    console.error('load state error', error);
    return null;
  }
}

function persistState(state: typeof defaultState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function YattokoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(defaultState);
  const [lastSyncAt, setLastSyncAt] = useState<number | undefined>();
  const offlineQueue = useOfflineQueue();

  useEffect(() => {
    const stored = loadPersistedState();
    if (stored) {
      setState(stored);
    }
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    const handler = () => {
      setState((prev) => ({ ...prev, isOffline: !navigator.onLine }));
      if (navigator.onLine) {
        setLastSyncAt(Date.now());
      }
    };
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    handler();
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  const addTask = (input: Partial<Task>) => {
    setState((prev) => {
      if (prev.user.plan === 'free') {
        const unlinkedCount = prev.tasks.filter((task) => !task.goal_id).length;
        if (!input.goal_id && unlinkedCount >= 10) {
          alert('無料プランでは未リンクのタスクは10件までです。プレミアムにアップグレードしてください。');
          return prev;
        }
      }
      const task: Task = {
        id: input.id ?? uuid(),
        user_id: prev.user.id,
        title: input.title ?? '新しいタスク',
        due_at: input.due_at,
        note: input.note,
        goal_id: input.goal_id ?? null,
        repeat_rule: input.repeat_rule,
        status: input.status ?? 'pending',
        created_at: new Date().toISOString()
      };
      if (prev.user.notify_prefs.remindersEnabled) {
        scheduleReminders(task, true);
      }
      if (state.isOffline) {
        enqueue({
          id: uuid(),
          type: 'create',
          entity: 'task',
          payload: task,
          createdAt: Date.now()
        });
      }
      return { ...prev, tasks: [...prev.tasks, task] };
    });
  };

  const toggleTaskStatus = (id: string) => {
    setState((prev) => {
      const tasks = prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === 'done' ? 'pending' : 'done',
              completed_at: task.status === 'done' ? undefined : new Date().toISOString()
            }
          : task
      );
      return { ...prev, tasks };
    });
  };

  const linkTaskToGoal = (taskId: string, goalId?: string | null) => {
    setState((prev) => {
      const tasks = prev.tasks.map((task) => (task.id === taskId ? { ...task, goal_id: goalId ?? null } : task));
      return { ...prev, tasks };
    });
  };

  const addGoal = (input: Partial<Goal>) => {
    setState((prev) => {
      if (prev.user.plan === 'free' && prev.goals.length >= 1) {
        alert('無料プランではゴールは1件までです。プレミアムにアップグレードしてください。');
        return prev;
      }
      const goal: Goal = {
        id: input.id ?? uuid(),
        user_id: prev.user.id,
        title: input.title ?? '新しいゴール',
        target_metric_type: input.target_metric_type,
        target_value: input.target_value,
        deadline: input.deadline,
        created_at: new Date().toISOString()
      };
      if (state.isOffline) {
        enqueue({ id: uuid(), type: 'create', entity: 'goal', payload: goal, createdAt: Date.now() });
      }
      return { ...prev, goals: [...prev.goals, goal] };
    });
  };

  const addHabit = (input: Partial<Habit>) => {
    setState((prev) => {
      if (!input.goal_id) {
        alert('習慣にはゴールが必要です。');
        return prev;
      }
      if (prev.user.plan === 'free') {
        const habitCount = prev.habits.filter((habit) => habit.goal_id === input.goal_id).length;
        if (habitCount >= 3) {
          alert('無料プランではゴールごとに習慣は3件までです。プレミアムにアップグレードしてください。');
          return prev;
        }
      }
      const habit: Habit = {
        id: input.id ?? uuid(),
        goal_id: input.goal_id,
        title: input.title ?? '新しい習慣',
        freq_type: input.freq_type ?? 'daily',
        days: input.days,
        time_hint: input.time_hint,
        created_at: new Date().toISOString()
      };
      if (state.isOffline) {
        enqueue({ id: uuid(), type: 'create', entity: 'habit', payload: habit, createdAt: Date.now() });
      }
      return { ...prev, habits: [...prev.habits, habit] };
    });
  };

  const recordCheckin = (habitId: string, date: string, status: Checkin['status']) => {
    setState((prev) => {
      const checkin: Checkin = {
        id: uuid(),
        habit_id: habitId,
        date,
        status
      };
      if (state.isOffline) {
        enqueue({ id: uuid(), type: 'create', entity: 'checkin', payload: checkin, createdAt: Date.now() });
      }
      return { ...prev, checkins: [...prev.checkins, checkin] };
    });
  };

  const setOffline = (offline: boolean) => {
    setState((prev) => ({ ...prev, isOffline: offline }));
    if (!offline) {
      setLastSyncAt(Date.now());
    }
  };

  const switchPlan = (plan: PlanTier) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, plan } }));
  };

  const updateMotivationBoost = (enabled: boolean) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, motivationBoostEnabled: enabled } }));
  };

  const updateReminders = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, notify_prefs: { ...prev.user.notify_prefs, remindersEnabled: enabled } }
    }));
  };

  const completeSync = () => {
    setLastSyncAt(Date.now());
  };

  const value = useMemo<YattokoState>(() => ({
    ...state,
    offlineQueue,
    lastSyncAt,
    addTask,
    toggleTaskStatus,
    linkTaskToGoal,
    addGoal,
    addHabit,
    recordCheckin,
    setOffline,
    switchPlan,
    updateMotivationBoost,
    updateReminders,
    completeSync,
    lastLoginLabel: state.user.motivationBoostEnabled
      ? `最終ログイン：${relativeLastLogin(state.user.last_login_at, state.user.tz)}`
      : 'モチベブーストOFF'
  }), [state, lastSyncAt]);

  return <YattokoContext.Provider value={value}>{children}</YattokoContext.Provider>;
}

export function useYattoko() {
  const ctx = useContext(YattokoContext);
  if (!ctx) {
    throw new Error('YattokoContextが見つかりません');
  }
  return ctx;
}
