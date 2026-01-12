'use client';

type LiquidTankBackgroundProps = {
  currentAsset: number;
  targetAsset: number;
  isNegative?: boolean; // 今月の収支が赤字かどうか、または前日比で大幅減少
};

export default function LiquidTankBackground({
  currentAsset,
  targetAsset,
  isNegative = false,
}: LiquidTankBackgroundProps) {
  // 水位を計算（0-100%）
  // 最大100%、最小0%に制限
  const waterLevel = targetAsset > 0 
    ? Math.min(100, Math.max(0, (currentAsset / targetAsset) * 100))
    : 0;

  // 色を決定
  const getWaterColor = () => {
    if (isNegative || currentAsset < 0) {
      // 警告時: 紫色（資産がマイナス、または大幅減少）
      return {
        gradientStart: 'rgba(168, 85, 247, 0.6)', // purple-500
        gradientEnd: 'rgba(236, 72, 153, 0.5)',   // pink-500
        waveColor: 'rgba(192, 132, 252, 0.4)',    // purple-400
      };
    }
    // 通常時: 美しいシアン〜青のグラデーション（不透明度を上げて見やすく）
    return {
      gradientStart: 'rgba(34, 211, 238, 0.8)',   // cyan-400 (from-cyan-400) - 不透明度を上げる
      gradientEnd: 'rgba(59, 130, 246, 0.7)',    // blue-500 (to-blue-500) - 不透明度を上げる
      waveColor: 'rgba(6, 182, 212, 0.6)',        // cyan-500 - 不透明度を上げる
    };
  };

  const colors = getWaterColor();
  // 画面下部から水位の高さまで満たす
  // デバッグ用: まず「青い帯」が見えることを確認するため、最低30%を表示
  // 本番環境では、実際の水位を使用: const waterHeight = `${waterLevel}%`;
  const debugWaterLevel = Math.max(waterLevel, 30); // デバッグ用: 最低30%を表示
  const waterHeight = `${debugWaterLevel}%`;
  
  // デバッグログ（開発時のみ）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('LiquidTank Debug:', {
      currentAsset,
      targetAsset,
      waterLevel: `${waterLevel.toFixed(2)}%`,
      displayHeight: waterHeight,
    });
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* 水面レイヤー1 - メインの波（最も目立つ） */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: waterHeight,
          background: `linear-gradient(to top, ${colors.gradientStart}, ${colors.gradientEnd})`,
          clipPath: 'polygon(0% 15%, 20% 10%, 40% 15%, 60% 12%, 80% 15%, 100% 13%, 100% 0%, 0% 0%)',
          animation: 'wave-smooth 10s ease-in-out infinite',
          transition: 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'height, clip-path',
          zIndex: -1,
        }}
      />

      {/* 水面レイヤー2 - 2層目の波（遅延アニメーション） */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: waterHeight,
          background: `linear-gradient(to top, ${colors.gradientStart}, ${colors.gradientEnd})`,
          clipPath: 'polygon(0% 20%, 25% 15%, 50% 20%, 75% 17%, 100% 20%, 100% 0%, 0% 0%)',
          animation: 'wave-smooth-delayed 12s ease-in-out infinite',
          transition: 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 0.75,
          willChange: 'height, clip-path',
        }}
      />

      {/* 水面レイヤー3 - 3層目の波（さらに遅延、より細かい波） */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: waterHeight,
          background: colors.waveColor,
          clipPath: 'polygon(0% 25%, 15% 22%, 35% 25%, 55% 23%, 75% 25%, 90% 24%, 100% 25%, 100% 0%, 0% 0%)',
          animation: 'wave-smooth-slow 14s ease-in-out infinite',
          transition: 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 0.6,
          willChange: 'height, clip-path',
        }}
      />

      {/* 水面レイヤー4 - 微細な波紋（最上層） */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: waterHeight,
          background: `linear-gradient(to top, ${colors.waveColor}, transparent)`,
          clipPath: 'polygon(0% 30%, 10% 28%, 30% 30%, 50% 29%, 70% 30%, 85% 29%, 100% 30%, 100% 0%, 0% 0%)',
          animation: 'wave-smooth-micro 16s ease-in-out infinite',
          transition: 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 0.4,
          willChange: 'height, clip-path',
        }}
      />

      <style jsx global>{`
        @keyframes wave-smooth {
          0%, 100% {
            clip-path: polygon(0% 15%, 20% 10%, 40% 15%, 60% 12%, 80% 15%, 100% 13%, 100% 0%, 0% 0%);
            transform: translateX(0);
          }
          25% {
            clip-path: polygon(0% 18%, 20% 13%, 40% 18%, 60% 15%, 80% 18%, 100% 16%, 100% 0%, 0% 0%);
            transform: translateX(2px);
          }
          50% {
            clip-path: polygon(0% 20%, 20% 15%, 40% 20%, 60% 17%, 80% 20%, 100% 18%, 100% 0%, 0% 0%);
            transform: translateX(0);
          }
          75% {
            clip-path: polygon(0% 17%, 20% 12%, 40% 17%, 60% 14%, 80% 17%, 100% 15%, 100% 0%, 0% 0%);
            transform: translateX(-2px);
          }
        }

        @keyframes wave-smooth-delayed {
          0%, 100% {
            clip-path: polygon(0% 20%, 25% 15%, 50% 20%, 75% 17%, 100% 20%, 100% 0%, 0% 0%);
            transform: translateX(0);
          }
          33% {
            clip-path: polygon(0% 22%, 25% 17%, 50% 22%, 75% 19%, 100% 22%, 100% 0%, 0% 0%);
            transform: translateX(-1px);
          }
          66% {
            clip-path: polygon(0% 18%, 25% 13%, 50% 18%, 75% 15%, 100% 18%, 100% 0%, 0% 0%);
            transform: translateX(1px);
          }
        }

        @keyframes wave-smooth-slow {
          0%, 100% {
            clip-path: polygon(0% 25%, 15% 22%, 35% 25%, 55% 23%, 75% 25%, 90% 24%, 100% 25%, 100% 0%, 0% 0%);
            transform: translateX(0);
          }
          50% {
            clip-path: polygon(0% 27%, 15% 24%, 35% 27%, 55% 25%, 75% 27%, 90% 26%, 100% 27%, 100% 0%, 0% 0%);
            transform: translateX(1px);
          }
        }

        @keyframes wave-smooth-micro {
          0%, 100% {
            clip-path: polygon(0% 30%, 10% 28%, 30% 30%, 50% 29%, 70% 30%, 85% 29%, 100% 30%, 100% 0%, 0% 0%);
            transform: translateX(0);
          }
          50% {
            clip-path: polygon(0% 32%, 10% 30%, 30% 32%, 50% 31%, 70% 32%, 85% 31%, 100% 32%, 100% 0%, 0% 0%);
            transform: translateX(-0.5px);
          }
        }
      `}</style>
    </div>
  );
}
