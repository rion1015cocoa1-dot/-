import { format, parseISO } from 'date-fns';
import { formatDistanceToNowStrict } from 'date-fns';
import { ja } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';

export function formatDeadline(deadline?: string, tz = 'Asia/Tokyo') {
  if (!deadline) return '期限なし';
  const date = utcToZonedTime(new Date(deadline), tz);
  return format(date, 'yyyy/MM/dd', { locale: ja });
}

export function relativeLastLogin(lastLogin?: string, tz = 'Asia/Tokyo') {
  if (!lastLogin) return 'たった今';
  const now = new Date();
  const target = utcToZonedTime(new Date(lastLogin), tz);
  const diffMs = now.getTime() - target.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return 'たった今';
  if (hours < 24) return `${Math.floor(hours)}時間前`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}日前`;
  return `前回から${Math.floor(days)}日ぶり`;
}

export function relativeFromNow(date: string) {
  return formatDistanceToNowStrict(parseISO(date), { locale: ja, addSuffix: true });
}
