import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ヤットコ！',
    short_name: 'ヤットコ！',
    description: 'もう後悔とはサヨナラ！小さな"今日やること"から始めよう。それが、いつのまにか"あなたのゴール"になる。',
    lang: 'ja',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFE3E3',
    theme_color: '#FF6B6B',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
}
