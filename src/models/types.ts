export type PlanTier = 'free' | 'premium';

export interface UserProfile {
  id: string;
  plan: PlanTier;
  tz: string;
  notify_prefs: {
    remindersEnabled: boolean;
  };
  last_login_at?: string;
  motivationBoostEnabled: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_metric_type?: string;
  target_value?: number;
  deadline?: string;
  created_at: string;
}

export interface Habit {
  id: string;
  goal_id: string;
  title: string;
  freq_type: 'daily' | 'weekly' | 'custom';
  days?: string[];
  time_hint?: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  due_at?: string;
  note?: string;
  goal_id?: string | null;
  repeat_rule?: string;
  status: 'pending' | 'done';
  created_at: string;
  completed_at?: string;
}

export interface Checkin {
  id: string;
  habit_id: string;
  date: string;
  status: 'done' | 'skip' | 'miss';
  note?: string;
  photo_url?: string;
}

export interface OfflineQueueItem<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'goal' | 'habit' | 'task' | 'checkin';
  payload: T;
  createdAt: number;
}
