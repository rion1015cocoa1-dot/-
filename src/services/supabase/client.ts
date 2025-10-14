import { createClient } from '@supabase/supabase-js';

export function createSupabaseBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabaseの環境変数が設定されていません。ブラウザ専用クライアントはスタブになります。');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'public-anon-key',
    {
      auth: {
        persistSession: true
      }
    }
  );
}
