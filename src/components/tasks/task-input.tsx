'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TaskInputProps {
  onAdd: (payload: { title: string; due_at?: string; note?: string }) => void;
}

const quickChips = ['5分片付け', '水を飲む', '英語-単語10'];

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), due_at: due ? new Date(due).toISOString() : undefined, note: note || undefined });
    setTitle('');
    setDue('');
    setNote('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <p className="text-sm font-semibold text-rose-500">まだゴールが決まっていなくても大丈夫。まずは"今日やること"を1つ決めよう。</p>
        <input
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-brand focus:outline-none"
          placeholder="今日やること"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-500">
            締切
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              value={due}
              onChange={(event) => setDue(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-500">
            メモ
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="ヒントや補足"
            />
          </label>
        </div>
        <Button className="mt-4 w-full" onClick={handleSubmit}>
          追加
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickChips.map((chip) => (
          <button
            key={chip}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600"
            onClick={() => onAdd({ title: chip })}
            type="button"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
