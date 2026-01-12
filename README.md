This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PWA (Progressive Web App) 対応

TankerはPWA対応しており、スマホのホーム画面に追加してアプリとして使用できます。

### アイコンファイルの準備

PWAを完全に機能させるには、以下のアイコンファイルを `public` フォルダに配置してください：

1. **`icon-192x192.png`** - 192x192ピクセルのPNG画像
2. **`icon-512x512.png`** - 512x512ピクセルのPNG画像

#### アイコン作成の手順

1. 正方形の画像を用意（推奨：タンクや水のイメージ、または「T」のロゴ）
2. 画像編集ソフトで192x192と512x512のサイズにリサイズ
3. `public` フォルダに配置

**簡易的な方法：**
- `public/icon.svg` を参考に、オンラインツール（例：RealFaviconGenerator）でPNGアイコンを生成
- または、既存の画像をリサイズして使用

### インストール方法

1. スマホのブラウザでTankerにアクセス
2. ブラウザのメニューから「ホーム画面に追加」を選択
3. アプリとして起動可能になります

### マニフェスト設定

PWAの設定は `public/manifest.json` で管理されています：
- アプリ名: "Tanker"
- テーマカラー: #06b6d4 (シアン)
- 表示モード: standalone（ブラウザUIなし）
