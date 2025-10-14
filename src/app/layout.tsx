import './globals.css';
import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { ReactNode } from 'react';
import { Providers } from '@/components/ui/providers';

const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'ヤットコ！',
  description: 'もう後悔とはサヨナラ！小さな"今日やること"から始めよう。それが、いつのまにか"あなたのゴール"になる。'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className="bg-slate-50">
      <body className={noto.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50 text-slate-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
