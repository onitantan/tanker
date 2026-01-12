import React from 'react';

type Props = {
  percentage: number;
};

const TankChart = ({ percentage }: Props) => {
  // 0〜100の範囲に収める
  const safePercentage = Math.min(100, Math.max(0, percentage));
  
  // 水位の高さ計算 (円の直径200px基準)
  // 100%なら0(上端), 0%なら200(下端)
  const yPos = 200 - (safePercentage * 2);

  return (
    <div className="relative w-full max-w-[200px] aspect-square mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <clipPath id="circleClip">
            <circle cx="100" cy="100" r="95" />
          </clipPath>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 背景の円（空） */}
        <circle cx="100" cy="100" r="95" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="4" />

        {/* 水（中身） */}
        <g clipPath="url(#circleClip)">
          <rect
            x="0"
            y={yPos}
            width="200"
            height="200"
            fill="url(#waterGradient)"
            className="transition-all duration-1000 ease-in-out"
          />
          {/* 波のアニメーション（オプション） */}
          <path
            d="M0 0 Q 50 10 100 0 T 200 0 V 20 H 0 Z"
            fill="#67e8f9"
            fillOpacity="0.5"
            transform={`translate(0, ${yPos})`}
          />
        </g>
        
        {/* 中央のパーセント表示 */}
        <text
          x="100"
          y="100"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#334155"
          className="text-3xl font-bold font-sans"
        >
          {Math.round(safePercentage)}%
        </text>
      </svg>
    </div>
  );
};

export default TankChart;
