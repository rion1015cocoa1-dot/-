'use client';

import { useEffect, useState } from 'react';
import { OfflineQueueItem } from '@/models/types';

const STORAGE_KEY = 'yattoko_offline_queue_v1';

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

function loadQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as OfflineQueueItem[]) : [];
  } catch (error) {
    console.error('queue load error', error);
    return [];
  }
}

function saveQueue(queue: OfflineQueueItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  subscribers.forEach((fn) => fn());
}

export function enqueue(item: OfflineQueueItem) {
  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
}

export function dequeueById(id: string) {
  const queue = loadQueue().filter((item) => item.id !== id);
  saveQueue(queue);
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(loadQueue());

  useEffect(() => {
    const listener = () => setQueue(loadQueue());
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return queue;
}
