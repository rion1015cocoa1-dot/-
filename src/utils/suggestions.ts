import { Task } from '@/models/types';

export interface GoalSuggestion {
  type: 'many-unlinked' | 'prefix';
  message: string;
  payload?: {
    prefix?: string;
  };
}

export function deriveGoalSuggestions(tasks: Task[]): GoalSuggestion[] {
  const suggestions: GoalSuggestion[] = [];
  const unlinked = tasks.filter((task) => !task.goal_id);
  if (unlinked.length >= 5) {
    suggestions.push({
      type: 'many-unlinked',
      message: '似たテーマのタスクが増えています。"ゴール"を作ってまとめますか？'
    });
  }

  const prefixMap = new Map<string, Task[]>();
  unlinked.forEach((task) => {
    const prefix = task.title.split('-')[0];
    if (!prefixMap.has(prefix)) {
      prefixMap.set(prefix, []);
    }
    prefixMap.get(prefix)!.push(task);
  });

  prefixMap.forEach((list, prefix) => {
    if (prefix && list.length >= 3) {
      suggestions.push({
        type: 'prefix',
        message: `'${prefix}'に関するタスクが${list.length}件あります。'${prefix}'のゴールを作りますか？`,
        payload: { prefix }
      });
    }
  });

  return suggestions;
}
