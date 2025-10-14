'use client';

import { useYattoko } from '@/hooks/yattoko-context';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/billing/pricing-card';
import { SubscriptionManager } from '@/components/billing/subscription-manager';
import { STRIPE_CONFIG } from '@/config/stripe';

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
        <div className="rounded-2xl bg-rose-50/60 p-4">
          <p className="text-sm font-semibold text-slate-700">
            現在のプラン: <span className="text-brand">{user.plan === 'free' ? '無料' : 'プレミアム'}</span>
          </p>
        </div>
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
        {user.plan === 'free' && (
          <Button onClick={() => switchPlan('premium')}>
            テストモード: プレミアムに切替
          </Button>
        )}
        {user.plan === 'premium' && (
          <Button onClick={() => switchPlan('free')} variant="outline">
            テストモード: 無料に戻す
          </Button>
        )}
      </Card>

      {user.plan === 'free' && (
        <>
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6">
            <h2 className="text-2xl font-bold text-slate-900">プレミアムプランで、もっと自由に！</h2>
            <p className="mt-2 text-sm text-slate-600">
              ゴールも習慣も無制限。あなたのペースで、自分らしく成長できます。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PricingCard
              userId={user.id}
              interval="monthly"
              price={STRIPE_CONFIG.pricing.monthly}
              priceId={STRIPE_CONFIG.prices.premium.monthly}
            />
            <PricingCard
              userId={user.id}
              interval="yearly"
              price={STRIPE_CONFIG.pricing.yearly}
              priceId={STRIPE_CONFIG.prices.premium.yearly}
            />
          </div>
        </>
      )}

      {user.plan === 'premium' && user.subscription && (
        <SubscriptionManager subscription={user.subscription} />
      )}
    </div>
  );
}
