# セキュリティ監査レポート

**プロジェクト**: yattoko (タスク管理・ゴール追跡・習慣形成アプリ)
**監査日**: 2026-01-29
**対象**: Next.js 14 + TypeScript + Supabase + Stripe

---

## 概要

本監査では、yattokoプロジェクトのセキュリティ上の脆弱性を調査しました。
**重大な問題が複数発見されました。本番環境へのデプロイ前に修正が必須です。**

---

## 発見された脆弱性

### 1. 🔴 重大 (Critical)

#### 1.1 XSS脆弱性 - localStorageへの機密データ保存

**ファイル**: `src/hooks/yattoko-context.tsx:58-72`

```typescript
function loadPersistedState(): typeof defaultState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as typeof defaultState) : null;
}

function persistState(state: typeof defaultState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

**問題点**:
- ユーザーID、プラン情報、Stripe顧客IDなどの機密データが平文でlocalStorageに保存されている
- localStorageはJavaScriptから直接アクセス可能であり、XSS攻撃により全データが漏洩する
- JSONパース時のスキーマ検証がない

**推奨修正**:
- 機密データはHttpOnly Cookieまたはサーバーセッションで管理
- zodでのスキーマ検証を追加
- Content Security Policy (CSP) ヘッダーの実装

---

#### 1.2 クライアント側のみのプラン制限 - 認可バイパス

**ファイル**: `src/hooks/yattoko-context.tsx:106-140`, `src/components/settings/settings-panel.tsx:82-90`

```typescript
// yattoko-context.tsx:106-114
if (prev.user.plan === 'free') {
  const unlinkedCount = prev.tasks.filter((task) => !task.goal_id).length;
  if (!input.goal_id && unlinkedCount >= 10) {
    alert('無料プランでは未リンクのタスクは10件までです。');
    return prev;
  }
}

// settings-panel.tsx:82-84
<Button onClick={() => switchPlan('premium')}>
  テストモード: プレミアムに切替
</Button>
```

**問題点**:
- プラン制限がクライアント側のみで実装されている
- ブラウザのDevToolsでlocalStorageを編集するか、`switchPlan('premium')`を実行するだけでプレミアム機能にアクセス可能
- 課金をバイパスして無制限にサービスを利用できる

**推奨修正**:
- サーバー側でのプラン検証を必須にする
- Supabase Row Level Security (RLS) でプランに基づくアクセス制御
- テストモードボタンを本番環境では削除

---

#### 1.3 入力値のサニタイズ・検証なし

**ファイル**: `src/components/tasks/task-input.tsx:17-23`

```typescript
const handleSubmit = () => {
  if (!title.trim()) return;
  onAdd({
    title: title.trim(),
    due_at: due ? new Date(due).toISOString() : undefined,
    note: note || undefined
  });
};
```

**問題点**:
- 入力値の長さチェックがない（DoS攻撃のリスク）
- HTMLタグのサニタイズがない（Stored XSS）
- zodによるスキーマ検証がインポートされているが未使用
- 日付の妥当性検証がない

**推奨修正**:
```typescript
import { z } from 'zod';

const TaskInputSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  due_at: z.string().datetime().optional(),
  note: z.string().max(1000).optional()
});
```

---

### 2. 🟠 高 (High)

#### 2.1 .gitignoreファイルの欠如

**問題点**:
- プロジェクトルートに`.gitignore`が存在しない
- `.env`ファイルがリポジトリにコミットされる可能性
- API キー、シークレットキーの漏洩リスク

**推奨修正**:
`.gitignore`ファイルを作成し、以下を含める：
```
.env
.env.local
.env.production
node_modules/
.next/
```

---

#### 2.2 オフラインキューのCSRF対策なし

**ファイル**: `src/services/offlineQueue/index.ts`

```typescript
export function enqueue(item: OfflineQueueItem) {
  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
}
```

**問題点**:
- オフラインキューの同期時にトークン検証がない
- 悪意のあるサイトからのクロスサイトリクエストを防げない

**推奨修正**:
- CSRFトークンを使用した同期リクエストの保護
- Supabaseの認証トークン検証

---

#### 2.3 Supabaseのフォールバック値

**ファイル**: `src/services/supabase/client.ts:7-9`

```typescript
return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'public-anon-key',
```

**問題点**:
- 環境変数が未設定でもアプリが動作する（サイレント障害）
- フォールバック値による予期しない動作

**推奨修正**:
```typescript
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase環境変数が設定されていません');
}
```

---

### 3. 🟡 中 (Medium)

#### 3.1 エラーログの情報漏洩

**ファイル**: `src/hooks/yattoko-context.tsx:64`, `src/services/offlineQueue/index.ts:17`

```typescript
console.error('load state error', error);
console.error('queue load error', error);
```

**問題点**:
- 本番環境でスタックトレースがコンソールに出力される
- デバッグ情報が攻撃者に利用される可能性

**推奨修正**:
- 本番環境ではエラーログを抑制またはサニタイズ
- エラー監視サービス（Sentry等）への統合

---

#### 3.2 タスク表示時のXSSリスク

**ファイル**: `src/components/tasks/task-list.tsx:42-45`

```typescript
<p className={cn('text-lg font-semibold', task.status === 'done' && 'line-through text-slate-400')}>
  {task.title}
</p>
{task.note && <p className="mt-1 text-sm text-slate-500">{task.note}</p>}
```

**問題点**:
- ReactはデフォルトでXSSを防ぐが、`dangerouslySetInnerHTML`の使用や将来の変更でリスクあり
- マークダウン/HTML対応を追加する際にXSSが発生しやすい

**推奨修正**:
- DOMPurifyなどのサニタイズライブラリの導入
- Content Security Policyの実装

---

#### 3.3 セキュリティヘッダーの欠如

**ファイル**: `next.config.js`

**問題点**:
- CSP (Content-Security-Policy) が未設定
- X-Frame-Options が未設定
- X-Content-Type-Options が未設定

**推奨修正**:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'" },
        ],
      },
    ];
  },
};
```

---

### 4. 🟢 低 (Low)

#### 4.1 デモユーザーIDのハードコード

**ファイル**: `src/hooks/yattoko-context.tsx:36`

```typescript
const defaultUser: UserProfile = {
  id: 'demo-user',
  // ...
};
```

**推奨修正**:
- 認証完了まで操作をブロック
- ゲストモードの場合は明示的なフラグを使用

---

#### 4.2 依存パッケージのセキュリティ

**ファイル**: `package.json`

**推奨対応**:
- `npm audit`を定期的に実行
- Dependabotの有効化
- 古いパッケージの更新

---

## 未実装だが参照されているモジュール

以下のファイルはインポートされていますが、実装が存在しません：

| ファイル | 参照元 |
|---------|--------|
| `@/components/billing/pricing-card` | settings-panel.tsx |
| `@/components/billing/subscription-manager` | settings-panel.tsx |
| `@/config/stripe` | settings-panel.tsx |
| `@/components/ai/ai-suggestions-section` | page.tsx |

**注意**: これらの実装時には、以下のセキュリティ要件を考慮してください：
- Stripe APIキーはサーバー側でのみ使用
- 支払い処理はサーバー側で検証
- OpenAI APIキーはクライアントに露出させない

---

## 修正優先度

| 優先度 | 項目 | 工数目安 |
|--------|------|---------|
| 1 | .gitignoreの作成 | 低 |
| 2 | テストモードボタンの本番無効化 | 低 |
| 3 | 入力値検証（zod）の実装 | 中 |
| 4 | プラン制限のサーバー側検証 | 高 |
| 5 | セキュリティヘッダーの追加 | 低 |
| 6 | 機密データのセッション管理 | 高 |
| 7 | CSRFトークンの実装 | 中 |

---

## 結論

本アプリケーションはクライアント側中心のアーキテクチャであり、**本番環境での使用には重大なセキュリティリスク**があります。

最優先で対応すべき事項：
1. **認可のサーバー側実装** - 課金バイパス防止
2. **入力値検証** - XSS/インジェクション防止
3. **機密データの適切な管理** - localStorage からの移行
4. **.gitignoreの作成** - シークレット漏洩防止

バックエンドAPIの実装と合わせて、上記のセキュリティ対策を講じることを強く推奨します。
