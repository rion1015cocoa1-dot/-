'use client';

import { useYattoko } from '@/hooks/yattoko-context';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';

export function SettingsPanel() {
  const { user, switchPlan, updateMotivationBoost, updateReminders } = useYattoko();

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">通知とタイムゾーン</h2>
        <p className="text-sm text-slate-500">タイムゾーン：{user.tz}</p>
        <Toggle
          checked={user.notify_prefs.remindersEnabled}
          onChange={updateReminders}
          label="リマインダー通知"
        />
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">モチベブースト</h2>
        <Toggle
          checked={user.motivationBoostEnabled}
          onChange={updateMotivationBoost}
          label="モチベブースト表示"
        />
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">プラン</h2>
        <table className="w-full text-sm text-slate-700">
          <thead>
            <tr className="text-left">
              <th className="py-2">機能</th>
              <th className="py-2">無料</th>
              <th className="py-2">プレミアム</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">ゴール上限</td>
              <td className="py-2">1件</td>
              <td className="py-2">無制限</td>
            </tr>
            <tr>
              <td className="py-2">ゴールあたりの習慣</td>
              <td className="py-2">3件</td>
              <td className="py-2">無制限</td>
            </tr>
            <tr>
              <td className="py-2">未リンクタスク</td>
              <td className="py-2">10件</td>
              <td className="py-2">無制限</td>
            </tr>
            <tr>
              <td className="py-2">週次/月次サマリー</td>
              <td className="py-2 text-slate-400">-</td>
              <td className="py-2">あり</td>
            </tr>
            <tr>
              <td className="py-2">CSVエクスポート</td>
              <td className="py-2 text-slate-400">-</td>
              <td className="py-2">あり</td>
            </tr>
            <tr>
              <td className="py-2">広告</td>
              <td className="py-2">あり</td>
              <td className="py-2">なし</td>
            </tr>
          </tbody>
        </table>
        <Button onClick={() => switchPlan(user.plan === 'free' ? 'premium' : 'free')}>
          {user.plan === 'free' ? 'プレミアムにアップグレード' : '無料プランに戻す'}
        </Button>
      </Card>
    </div>
  );
}
