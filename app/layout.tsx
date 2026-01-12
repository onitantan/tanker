import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // 汎用的なInterフォントを使います
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. 基本メタデータ
export const metadata: Metadata = {
  title: "Tanker - Asset Tank Management",
  description: "個人の財務管理ツール - 資産の貯水槽",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tanker",
  },
};

// 2. スマホ表示設定（ここを分けるのが新しいルールです）
export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // アプリっぽくズーム禁止
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* スマホ用レイアウト：背景グレー、中央寄せ、最大幅固定 */}
      <body className={`${inter.className} overflow-x-hidden bg-gray-50 text-gray-900 antialiased`}>
        <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}