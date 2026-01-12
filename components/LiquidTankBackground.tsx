import React, { useEffect, useState } from 'react';

interface LiquidTankBackgroundProps {
  percentage: number;
}

const LiquidTankBackground: React.FC<LiquidTankBackgroundProps> = ({ percentage }) => {
  // 安全策：0%〜100%の間に収める
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  // マウント時のアニメーション用
  const [visualPercentage, setVisualPercentage] = useState(0);

  useEffect(() => {
    // 少し遅れて目標値までアニメーションさせる
    const timer = setTimeout(() => {
      setVisualPercentage(clampedPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [clampedPercentage]);

  return (
    <div className="relative h-64 w-64 mx-auto my-8">
      {/* 1. 外側の円（コンテナ） */}
      <div className="absolute inset-0 rounded-full border-4 border-gray-200 bg-white shadow-inner overflow-hidden transform translate-z-0">
        
        {/* 2. 水の部分（波のアニメーション） */}
        {/* transform: translate3d(0,0,0) を使うことでGPUを強制使用し、カクつきを抑える */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-cyan-400 transition-all duration-1000 ease-out"
          style={{ 
            height: `${visualPercentage}%`,
            transform: 'translate3d(0,0,0)', 
          }}
        >
          {/* 波のうねり（CSSアニメーション） */}
          <div className="absolute top-[-10px] left-0 right-0 h-4 w-[200%] animate-wave bg-cyan-400 opacity-50" 
               style={{ transform: 'translate3d(0,0,0)' }}></div>
          <div className="absolute top-[-15px] left-0 right-0 h-4 w-[200%] animate-wave-slow bg-cyan-300 opacity-30"
               style={{ transform: 'translate3d(0,0,0)' }}></div>
        </div>

        {/* 3. テキスト表示（文字がはみ出さない工夫） */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-sm font-bold text-gray-500 drop-shadow-sm">
            達成率
          </span>
          <span className="text-4xl font-black text-gray-800 drop-shadow-md">
            {Math.round(visualPercentage)}
            <span className="text-lg font-normal ml-1">%</span>
          </span>
        </div>
      </div>
      
      {/* グローバルCSS（波の動き定義） */}
      <style jsx global>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 3s linear infinite;
          border-radius: 40%;
        }
        .animate-wave-slow {
          animation: wave 6s linear infinite;
          border-radius: 35%;
        }
      `}</style>
    </div>
  );
};

export default LiquidTankBackground;