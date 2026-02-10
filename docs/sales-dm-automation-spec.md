# 営業DM自動生成ツール 仕様書

## 1. 概要

### 1.1 プロダクトビジョン
SNSアカウントのURLを入力するだけで、相手のプロフィール・投稿内容を分析し、パーソナライズされた営業DMを自動生成するツール。

### 1.2 解決する課題
| 課題 | 現状 | 本ツールで |
|------|------|-----------|
| DM作成の工数 | 1件あたり10〜20分 | 1件あたり30秒以下 |
| パーソナライズの質 | 担当者のスキルに依存 | AIが一貫した品質で生成 |
| スケーラビリティ | 1日20〜30件が限界 | 1日数百件対応可能 |
| 属人化 | トップセールスの暗黙知 | テンプレート+AIで組織共有 |

---

## 2. 技術的実現可能性の評価

### 2.1 対応SNSプラットフォーム別の評価（実態ベース）

| プラットフォーム | 方法 | ブロックリスク | 取得可能情報 | 実現性 |
|-----------------|------|---------------|-------------|--------|
| **X (Twitter)** | X API v2 (Basic: $100/月) | ほぼなし | プロフィール、直近ツイート、bio | **◎ 確実** |
| **YouTube** | YouTube Data API v3 (無料) | ほぼなし | チャンネル名、説明、動画タイトル | **◎ 確実** |
| **GitHub** | REST/GraphQL API (無料) | ほぼなし | プロフィール、リポジトリ、README | **◎ 確実** |
| **note / Zenn** | サーバーサイドHTML取得 | 低〜中（頻度制限あり） | プロフィール、記事タイトル・冒頭 | **○ 条件付き** |
| **Instagram** | ~~Basic Display API~~ **2024年廃止済み** | 即ブロック | — | **× 不可** |
| **LinkedIn** | 公式APIは審査制（個人開発者には非承認） | 法的リスク+即ブロック | — | **× 不可** |
| **Facebook** | Graph API (極めて限定的) | 高い | — | **× 非推奨** |

> **重要: Instagram / LinkedIn / Facebook は公式手段でのプロフィール自動取得が実質不可能。**
> これらのプラットフォームには「手動入力モード」で対応する（後述）。

### 2.1.1 ハイブリッドアプローチ（推奨）

「全自動」にこだわらず、プラットフォームの制約に応じて2つの入力モードを用意する:

```
モード1: 自動取得（API経由）
  URL入力 → プロフィール自動取得 → AI分析 → DM生成
  対応: X, YouTube, GitHub, note, Zenn

モード2: 手動入力（取得不可プラットフォーム用）
  プラットフォーム選択 → ユーザーがプロフィール情報をコピペ → AI分析 → DM生成
  対応: Instagram, LinkedIn, Facebook, その他すべて
```

手動入力モードの画面イメージ:
```
┌──────────────────────────────────────────┐
│ プラットフォーム: [Instagram ▼]            │
│                                          │
│ 相手の名前:     [_____________]          │
│ 自己紹介文:     [_____________]          │
│ 最近の投稿内容: [                        │
│   (プロフィール画面からコピペ)             │
│                 ]                        │
│ 役職・会社名:   [_____________]          │
│                                          │
│     → これだけでAI分析&DM生成が可能       │
└──────────────────────────────────────────┘
```

**手動入力でも、AIによるパーソナライズDM生成の価値は十分に発揮される。**
プロフィールの「自動取得」は利便性の問題であり、DM品質の本質ではない。

### 2.2 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    フロントエンド (Next.js)                │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ URL入力   │→│ プレビュー │→│ DM生成結果 & 編集画面  │  │
│  │ フォーム  │  │ & 分析表示 │  │                      │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ API Routes
┌────────────────────▼────────────────────────────────────┐
│                  バックエンド (Next.js API Routes)        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ URL解析      │→│ プロフィール  │→│ DM生成         │  │
│  │ & プラット   │  │ データ取得   │  │ (OpenAI API)   │  │
│  │   フォーム判定│  │ サービス     │  │                │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ テンプレート │  │ 生成履歴     │  │ 利用制限      │  │
│  │ 管理         │  │ 管理         │  │ & 課金        │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 外部サービス                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ OpenAI   │ │ X API    │ │ Supabase │ │ Stripe    │  │
│  │ GPT-4o   │ │ v2       │ │ DB/Auth  │ │ 課金      │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.3 技術スタック（既存資産を活用）

| レイヤー | 技術 | 状態 |
|----------|------|------|
| フロントエンド | Next.js 14 + React 18 + Tailwind CSS | **既存** |
| フォーム管理 | React Hook Form + Zod | **既存** |
| バックエンド API | Next.js API Routes | **既存** |
| AI生成エンジン | OpenAI SDK (openai@6.3.0) | **既存（未統合）** |
| データベース | Supabase (PostgreSQL) | **既存** |
| 認証 | Supabase Auth | **既存** |
| 課金 | Stripe | **既存（未統合）** |
| スクレイピング | cheerio + node-fetch | **新規追加** |
| キャッシュ | Supabase or Redis | **新規追加** |

---

## 3. 機能要件

### 3.1 コア機能

#### F-01: URL入力 & プラットフォーム自動判定
```
入力: https://x.com/example_user
       ↓ 自動判定
出力: プラットフォーム = "X (Twitter)"
      ユーザーID = "example_user"
```

**対応URLパターン:**
```
X:         https://x.com/{username}, https://twitter.com/{username}
Instagram: https://instagram.com/{username}
LinkedIn:  https://linkedin.com/in/{slug}
note:      https://note.com/{username}
YouTube:   https://youtube.com/@{handle}
```

#### F-02: プロフィール情報の自動取得・分析
取得する情報:
- **基本情報**: 名前、bio/自己紹介、アイコン画像
- **活動情報**: 直近の投稿内容（5〜10件）、投稿頻度
- **興味・関心**: 投稿キーワードの分析、使用ハッシュタグ
- **ビジネス情報**: 会社名、役職、業種（推定）

#### F-03: パーソナライズDM生成
OpenAI GPT-4o を使用し、以下の要素を組み合わせてDMを生成:

| 入力要素 | 説明 |
|----------|------|
| 相手のプロフィール分析結果 | 自動取得した情報 |
| 自社の商材情報 | ユーザーが事前設定 |
| DMテンプレート | カスタマイズ可能なベーステンプレート |
| トーン設定 | カジュアル / ビジネス / フレンドリー |
| DM目的 | 商談獲得 / セミナー誘導 / 資料送付 etc. |

**生成プロンプト構造（例）:**
```
あなたは熟練の営業担当です。以下の情報を基に、自然でパーソナライズされた
営業DMを作成してください。

## 送信相手の情報
- 名前: {name}
- プロフィール: {bio}
- 最近の投稿内容: {recent_posts}
- 推定される関心事: {interests}
- 推定業種: {industry}

## 自社の商材
- 商品/サービス名: {product_name}
- 主な価値提案: {value_proposition}
- ターゲット課題: {target_pain_points}

## DM条件
- トーン: {tone}
- 文字数: {max_chars}文字以内
- 目的: {purpose}
- プラットフォーム: {platform}

## 制約
- 相手の投稿内容に具体的に言及し、共感を示すこと
- 売り込み感を抑え、相手のメリットを中心に構成すること
- {platform}の文化に合った文体にすること
- CTA（次のアクション）を1つだけ含めること
```

#### F-04: DM編集・微調整
- 生成されたDMをリアルタイムで編集可能
- 「もう少しカジュアルに」「もっと短く」等のワンクリック調整ボタン
- 複数バリエーション生成（A/B テスト用に3パターン）

#### F-05: テンプレート管理
- 業種別・目的別のDMテンプレートを保存
- 成功率の高いテンプレートを「お気に入り」登録
- チーム内でテンプレート共有

#### F-06: 生成履歴 & 効果測定
- 過去に生成したDM一覧を閲覧
- 送信済み/返信あり/商談化 のステータス管理（手動更新）
- テンプレート別・業種別の返信率ダッシュボード

---

## 4. データモデル

### 4.1 新規テーブル定義

```sql
-- 自社商材情報（ユーザーが事前設定）
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  value_proposition TEXT,
  target_pain_points TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DMテンプレート
CREATE TABLE dm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  tone TEXT CHECK (tone IN ('casual', 'business', 'friendly')),
  purpose TEXT CHECK (purpose IN ('meeting', 'seminar', 'document', 'free_trial', 'other')),
  base_prompt TEXT NOT NULL,
  platform TEXT,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SNSプロフィールキャッシュ
CREATE TABLE sns_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  url TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  recent_posts JSONB,       -- [{text, date, engagement}]
  analyzed_interests TEXT[], -- AI分析による関心事
  estimated_industry TEXT,   -- AI推定の業種
  raw_data JSONB,           -- スクレイピング生データ
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, username)
);

-- 生成DM履歴
CREATE TABLE generated_dms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  template_id UUID REFERENCES dm_templates(id),
  product_id UUID REFERENCES products(id),
  profile_id UUID REFERENCES sns_profiles(id),
  platform TEXT NOT NULL,
  recipient_name TEXT,
  recipient_url TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  tone TEXT,
  purpose TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'replied', 'meeting_booked', 'converted'))
    DEFAULT 'draft',
  ai_model TEXT DEFAULT 'gpt-4o',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- 効果測定集計ビュー
CREATE VIEW dm_analytics AS
SELECT
  user_id,
  template_id,
  platform,
  purpose,
  COUNT(*) AS total_generated,
  COUNT(*) FILTER (WHERE status = 'sent') AS total_sent,
  COUNT(*) FILTER (WHERE status = 'replied') AS total_replied,
  COUNT(*) FILTER (WHERE status = 'meeting_booked') AS total_meetings,
  COUNT(*) FILTER (WHERE status = 'converted') AS total_converted,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('replied','meeting_booked','converted'))::NUMERIC
    / NULLIF(COUNT(*) FILTER (WHERE status != 'draft'), 0) * 100, 1
  ) AS reply_rate
FROM generated_dms
GROUP BY user_id, template_id, platform, purpose;
```

### 4.2 TypeScript型定義

```typescript
// src/models/dm-types.ts

export type DmTone = 'casual' | 'business' | 'friendly';
export type DmPurpose = 'meeting' | 'seminar' | 'document' | 'free_trial' | 'other';
export type DmStatus = 'draft' | 'sent' | 'replied' | 'meeting_booked' | 'converted';
export type SnsPlatform = 'x' | 'instagram' | 'linkedin' | 'note' | 'youtube';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  value_proposition: string;
  target_pain_points: string[];
}

export interface DmTemplate {
  id: string;
  user_id: string;
  name: string;
  tone: DmTone;
  purpose: DmPurpose;
  base_prompt: string;
  platform?: SnsPlatform;
  is_favorite: boolean;
  usage_count: number;
}

export interface SnsProfile {
  id: string;
  platform: SnsPlatform;
  username: string;
  url: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  recent_posts: Array<{
    text: string;
    date: string;
    engagement?: number;
  }>;
  analyzed_interests: string[];
  estimated_industry?: string;
  fetched_at: string;
}

export interface GeneratedDm {
  id: string;
  user_id: string;
  template_id?: string;
  product_id?: string;
  profile_id: string;
  platform: SnsPlatform;
  recipient_name?: string;
  recipient_url: string;
  generated_text: string;
  tone: DmTone;
  purpose: DmPurpose;
  status: DmStatus;
  ai_model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
  sent_at?: string;
  replied_at?: string;
}

// API リクエスト/レスポンス
export interface GenerateDmRequest {
  sns_url: string;
  product_id: string;
  template_id?: string;
  tone: DmTone;
  purpose: DmPurpose;
  max_chars?: number;        // デフォルト: 300
  variation_count?: number;  // デフォルト: 3
}

export interface GenerateDmResponse {
  profile: SnsProfile;
  variations: Array<{
    text: string;
    prompt_tokens: number;
    completion_tokens: number;
  }>;
}
```

---

## 5. API設計

### 5.1 エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/dm/analyze` | SNS URLを解析しプロフィール情報を取得 |
| POST | `/api/dm/generate` | パーソナライズDMを生成 |
| POST | `/api/dm/refine` | 生成済みDMを微調整 |
| GET | `/api/dm/history` | 生成履歴一覧 |
| PATCH | `/api/dm/history/:id` | DMステータス更新 |
| CRUD | `/api/dm/templates` | テンプレート管理 |
| CRUD | `/api/dm/products` | 商材情報管理 |
| GET | `/api/dm/analytics` | 効果測定データ |

### 5.2 主要APIフロー

```
1. ユーザーがSNS URLを入力
   POST /api/dm/analyze { url: "https://x.com/target_user" }
     ↓
2. サーバーがプラットフォーム判定 → プロフィール取得 → AI分析
     ↓
3. 分析結果をフロントに返却（プレビュー表示）
     ↓
4. ユーザーがトーン・目的・商材を選択して生成リクエスト
   POST /api/dm/generate { sns_url, product_id, tone, purpose }
     ↓
5. OpenAI APIでDMを3パターン生成
     ↓
6. ユーザーが選択・編集・送信
```

---

## 6. 画面設計

### 6.1 画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| DM生成メイン | `/dm` | URL入力→分析→生成の一気通貫画面 |
| テンプレート管理 | `/dm/templates` | テンプレートCRUD |
| 商材設定 | `/dm/products` | 自社商材の登録・管理 |
| 生成履歴 | `/dm/history` | 過去のDM一覧と効果追跡 |
| ダッシュボード | `/dm/analytics` | 返信率・商談化率の可視化 |

### 6.2 DM生成メイン画面のワイヤーフレーム

```
┌─────────────────────────────────────────────────┐
│  営業DM自動生成                                    │
├─────────────────────────────────────────────────┤
│                                                   │
│  SNSアカウントURL                                  │
│  ┌─────────────────────────────────┬──────────┐  │
│  │ https://x.com/example_user      │  分析する │  │
│  └─────────────────────────────────┴──────────┘  │
│                                                   │
│  ── 分析結果 ──────────────────────────────────── │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🖼 example_user                              │ │
│  │ フルスタックエンジニア | スタートアップCTO      │ │
│  │                                              │ │
│  │ 関心: React, AI, スタートアップ経営            │ │
│  │ 業種(推定): IT・テクノロジー                   │ │
│  │ 直近の話題: Next.js 15, AI活用, チーム開発     │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ── DM設定 ────────────────────────────────────── │
│  商材: [SaaSプロダクトA        ▼]                  │
│  目的: ○商談 ○セミナー ○資料送付 ○無料体験        │
│  トーン: ○カジュアル ●ビジネス ○フレンドリー        │
│  文字数上限: [300] 文字                            │
│  テンプレート: [デフォルト        ▼]               │
│                                                   │
│          [  DMを生成する  ]                        │
│                                                   │
│  ── 生成結果 ──────────────────────────────────── │
│  ┌─ パターンA ──────────────────────────────────┐ │
│  │ はじめまして。○○と申します。                  │ │
│  │ Next.js 15に関する投稿を拝見し、技術への      │ │
│  │ 深い知見に感銘を受けました。                  │ │
│  │ 弊社では...                                  │ │
│  │                                    [コピー]   │ │
│  └──────────────────────────────────────────────┘ │
│  ┌─ パターンB ──────────────────────────────────┐ │
│  │ ...                                          │ │
│  └──────────────────────────────────────────────┘ │
│  ┌─ パターンC ──────────────────────────────────┐ │
│  │ ...                                          │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  [もっとカジュアルに] [もっと短く] [再生成]         │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 7. 処理フロー詳細

### 7.1 プロフィール取得フロー

```
URL入力
  │
  ├─ URLパース → プラットフォーム判定
  │
  ├─ キャッシュ確認（24時間以内のデータがあればスキップ）
  │
  ├─ プラットフォーム別データ取得
  │   ├─ X: X API v2 → users/by/username + tweets
  │   ├─ Instagram: プロフィールページ HTML パース
  │   ├─ LinkedIn: 公開プロフィールページパース
  │   ├─ note: ユーザーページ HTML パース
  │   └─ YouTube: YouTube Data API v3
  │
  ├─ OpenAI で分析
  │   ├─ 関心事の抽出
  │   ├─ 業種・職種の推定
  │   └─ パーソナリティ傾向の推定
  │
  └─ 結果をDBにキャッシュ & フロントに返却
```

### 7.2 DM生成フロー

```
生成リクエスト受信
  │
  ├─ プロフィールデータ取得（キャッシュ or 新規取得）
  │
  ├─ テンプレートのプロンプトにデータを注入
  │
  ├─ OpenAI GPT-4o API呼び出し
  │   ├─ temperature: 0.8（バリエーション確保）
  │   ├─ n: 3（3パターン同時生成）
  │   └─ max_tokens: プラットフォーム制限に応じて調整
  │
  ├─ 生成結果をバリデーション
  │   ├─ 文字数チェック
  │   ├─ 禁止ワードチェック
  │   └─ パーソナライズ要素の含有チェック
  │
  └─ 結果をDBに保存 & フロントに返却
```

---

## 8. 実装計画（フェーズ分割）

### Phase 1: MVP（最小実現可能プロダクト）
**期間目安: スプリント1〜2**

- [x] 仕様書作成（本ドキュメント）
- [ ] URL解析 & プラットフォーム判定ユーティリティ
- [ ] X (Twitter) プロフィール取得（API経由）
- [ ] OpenAI連携によるDM生成（1パターン）
- [ ] DM生成画面（URL入力→分析→生成→コピー）
- [ ] Supabaseテーブル作成

### Phase 2: コア機能拡充
**期間目安: スプリント3〜4**

- [ ] 複数パターン生成（3バリエーション）
- [ ] DM微調整機能（トーン変更、短縮）
- [ ] テンプレート管理CRUD
- [ ] 商材情報管理
- [ ] 生成履歴一覧画面
- [ ] Instagram / note 対応

### Phase 3: 効果測定 & チーム機能
**期間目安: スプリント5〜6**

- [ ] DMステータス管理（送信済み→返信あり→商談化）
- [ ] 効果測定ダッシュボード
- [ ] CSV一括インポート（複数URL同時処理）
- [ ] チーム共有機能（テンプレート共有）
- [ ] Stripe課金連携（Free/Pro プラン）

### Phase 4: 高度な機能
**期間目安: 将来**

- [ ] LinkedIn / YouTube 対応
- [ ] AIによるDM送信タイミング最適化
- [ ] A/Bテスト自動化
- [ ] CRM連携（HubSpot, Salesforce）
- [ ] Chrome拡張（SNS画面から直接DM生成）

---

## 9. コスト試算

### 9.1 API利用コスト（月間1,000件生成の場合）

| サービス | 用途 | 単価 | 月間コスト（概算） |
|----------|------|------|-------------------|
| OpenAI GPT-4o | プロフィール分析 + DM生成 | ~$0.01/リクエスト | ~$10 |
| X API v2 Basic | ツイート取得 | $100/月（定額） | $100 |
| YouTube Data API | チャンネル情報 | 無料枠10,000/日 | $0 |
| Supabase | DB + Auth | Free〜$25/月 | $0〜$25 |
| Vercel | ホスティング | Free〜$20/月 | $0〜$20 |
| **合計** | | | **$110〜$155/月** |

### 9.2 収益モデル案

| プラン | 月額 | 含まれる機能 |
|--------|------|-------------|
| Free | ¥0 | 月10件生成、1商材、基本テンプレート |
| Pro | ¥4,980 | 月300件生成、無制限商材、全テンプレート、履歴 |
| Business | ¥14,980 | 無制限生成、チーム5名、ダッシュボード、CSV一括 |
| Enterprise | 要問合せ | カスタムAPI、CRM連携、専用サポート |

---

## 10. 法的・倫理的考慮事項

### 10.1 各プラットフォームの利用規約（2025年時点の実態）

| プラットフォーム | スクレイピング | API利用 | 現実的な対応 |
|-----------------|--------------|---------|-------------|
| X | 規約上禁止 | **API v2 Basic ($100/月) で安定利用可** | API利用一択 |
| YouTube | 規約上禁止 | **Data API v3 無料枠で十分** | API利用一択 |
| Instagram | 規約上禁止、即ブロック | **Basic Display API 2024年廃止** | **手動入力モードで対応** |
| LinkedIn | 明確に禁止、**訴訟リスクあり** | 審査制（個人開発者には非承認） | **手動入力モードで対応** |
| note / Zenn | 明確な規定なし | 公式APIなし | サーバーサイドHTML取得（低頻度） |

### 10.2 対策

1. **公式API最優先**: スクレイピングではなく公式APIを使用する
2. **取得不可プラットフォームは手動入力**: Instagram/LinkedInは自動取得を試みない
3. **公開情報のみ利用**: 非公開アカウントの情報は取得しない
4. **キャッシュ管理**: 取得データは24時間で更新、ユーザー削除に対応
5. **レート制限の厳守**: 各APIのレート制限を厳密に守る
6. **手動送信のみ**: 生成されたDMの送信はユーザーが手動で行う（自動送信しない）
7. **利用規約の明示**: ユーザーに各プラットフォームのDM送信規約遵守を促す

### 10.3 個人情報保護

- 取得するのは公開プロフィール情報のみ
- ユーザーの要請に応じてキャッシュデータを削除
- 特定電子メール法・個人情報保護法への準拠を確認

---

## 11. ファイル構成（実装時）

```
src/
├── app/
│   ├── dm/
│   │   ├── page.tsx                  # DM生成メイン画面
│   │   ├── templates/
│   │   │   └── page.tsx              # テンプレート管理
│   │   ├── products/
│   │   │   └── page.tsx              # 商材管理
│   │   ├── history/
│   │   │   └── page.tsx              # 生成履歴
│   │   └── analytics/
│   │       └── page.tsx              # ダッシュボード
│   └── api/
│       └── dm/
│           ├── analyze/
│           │   └── route.ts          # プロフィール分析API
│           ├── generate/
│           │   └── route.ts          # DM生成API
│           ├── refine/
│           │   └── route.ts          # DM微調整API
│           ├── history/
│           │   └── route.ts          # 履歴API
│           ├── templates/
│           │   └── route.ts          # テンプレートAPI
│           └── products/
│               └── route.ts          # 商材API
├── components/
│   └── dm/
│       ├── url-input.tsx             # URL入力フォーム
│       ├── profile-preview.tsx       # プロフィール分析プレビュー
│       ├── dm-settings.tsx           # DM設定パネル
│       ├── dm-result-card.tsx        # 生成結果カード
│       ├── dm-editor.tsx             # DM編集エリア
│       ├── template-list.tsx         # テンプレート一覧
│       ├── product-form.tsx          # 商材登録フォーム
│       ├── history-table.tsx         # 履歴テーブル
│       └── analytics-chart.tsx       # 分析チャート
├── services/
│   ├── sns/
│   │   ├── parser.ts                # URL解析 & プラットフォーム判定
│   │   ├── x-fetcher.ts             # X API連携
│   │   ├── instagram-fetcher.ts     # Instagram情報取得
│   │   ├── note-fetcher.ts          # note情報取得
│   │   └── youtube-fetcher.ts       # YouTube API連携
│   ├── ai/
│   │   ├── profile-analyzer.ts      # プロフィール分析
│   │   ├── dm-generator.ts          # DM生成
│   │   └── dm-refiner.ts            # DM微調整
│   └── dm/
│       ├── template-service.ts      # テンプレート管理
│       ├── history-service.ts       # 履歴管理
│       └── analytics-service.ts     # 効果分析
└── models/
    └── dm-types.ts                  # 型定義
```

---

## 12. 結論: 実現可能性の総合評価

| 観点 | 評価 | 補足 |
|------|------|------|
| **技術的実現性** | **◎ 十分可能** | 既存スタック(Next.js+OpenAI+Supabase)で構築可能 |
| **X (Twitter) 自動取得** | **◎ 確実** | API v2 Basicで安定的にデータ取得可能 |
| **YouTube 自動取得** | **◎ 確実** | Data API v3 無料枠で十分 |
| **note / Zenn 自動取得** | **○ 条件付き** | HTML取得可能だが頻度制限に注意 |
| **Instagram 自動取得** | **× 不可** | API廃止済み → 手動入力モードで対応 |
| **LinkedIn 自動取得** | **× 不可** | 法的リスク → 手動入力モードで対応 |
| **AI生成品質** | **◎** | GPT-4oで十分な品質のDM生成が可能 |
| **コスト** | **◎** | 月$110〜155で1,000件対応可能 |
| **法的リスク** | **◎** | 公式API+手動入力のハイブリッドで安全 |
| **市場ニーズ** | **◎** | 営業効率化ニーズは非常に高い |

**結論: 本ツールは技術的に十分実現可能。ただし「全SNS全自動取得」は非現実的であり、公式API対応プラットフォーム（X, YouTube）は自動取得、それ以外（Instagram, LinkedIn）は手動入力のハイブリッドアプローチが最も現実的。DM生成品質の本質はプロフィール情報のAI活用にあり、取得方法が手動でも価値は損なわれない。まずはX (Twitter) 自動取得 + 手動入力モードのMVPから開始を推奨。**
