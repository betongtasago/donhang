import React from 'react';

interface TsgLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const TsgLogo: React.FC<TsgLogoProps> = ({
  className = 'w-full max-w-[130px]',
  width,
  height
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`} style={{ width, height }}>
      <svg
        viewBox="0 0 200 135"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tsgBlueGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="60%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#004b93" />
          </linearGradient>
          <linearGradient id="tsgBlueGrad2" x1="10%" y1="50%" x2="90%" y2="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#034694" />
          </linearGradient>
        </defs>

        {/* 1. GLOBE SWIRL & AIRPLANES */}
        <g transform="translate(6, 0)">
          {/* Top sweeping curve of globe */}
          <path
            d="M 52 56 C 30 52, 18 40, 24 28 C 32 14, 58 8, 86 11 C 104 13, 118 19, 126 26 C 110 18, 76 13, 50 18 C 32 22, 25 31, 33 39 C 39 45, 52 49, 68 50 Z"
            fill="url(#tsgBlueGrad1)"
          />

          {/* Central core globe shape */}
          <path
            d="M 44 58 C 32 54, 25 46, 26 38 C 28 30, 36 24, 48 20 C 40 26, 37 34, 41 40 C 47 48, 65 52, 86 52 C 106 52, 122 47, 128 41 C 129 45, 125 49, 118 53 C 102 61, 68 62, 44 58 Z"
            fill="#034694"
          />

          {/* Lower crescent / globe bottom bowl */}
          <path
            d="M 32 42 C 34 52, 45 61, 62 65 C 78 69, 100 68, 114 61 C 120 57, 124 51, 125 45 C 119 51, 110 56, 96 58 C 78 61, 58 59, 44 52 C 38 48, 34 45, 32 42 Z"
            fill="url(#tsgBlueGrad2)"
          />

          {/* Dynamic Flight Streams into the 3 Airplanes */}
          {/* Stream 1 (Upper leading to plane 1) */}
          <path
            d="M 38 38 C 48 28, 68 22, 94 24 C 114 25, 134 19, 148 11 L 150 13 C 134 22, 112 29, 90 27 C 68 25, 48 31, 38 38 Z"
            fill="#0284c7"
          />

          {/* Stream 2 (Middle leading to main plane 2) */}
          <path
            d="M 40 45 C 56 36, 82 32, 112 32 C 132 32, 148 26, 162 17 L 164 19 C 148 29, 130 36, 108 36 C 80 36, 54 41, 40 45 Z"
            fill="#0369a1"
          />

          {/* Stream 3 (Lower leading to plane 3) */}
          <path
            d="M 48 52 C 68 45, 96 42, 124 42 C 142 42, 158 37, 170 28 L 172 30 C 158 40, 138 46, 118 46 C 90 46, 64 49, 48 52 Z"
            fill="#004b93"
          />

          {/* AIRPLANE 1 (Top leading jet) */}
          <g transform="translate(148, 10) rotate(32) scale(0.9)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#0284c7"
            />
          </g>

          {/* AIRPLANE 2 (Center main jet) */}
          <g transform="translate(166, 17) rotate(32) scale(1.1)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#004b93"
            />
          </g>

          {/* AIRPLANE 3 (Trailing escort jet below) */}
          <g transform="translate(154, 30) rotate(32) scale(0.75)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#0284c7"
            />
          </g>
        </g>

        {/* 2. TEXT "TSG-TNT" IN BOLD CRIMSON RED */}
        <text
          x="100"
          y="102"
          textAnchor="middle"
          fill="#dc2626"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="1"
        >
          TSG-TNT
        </text>

        {/* 3. SLOGAN "Cất cánh vươn cao" IN PETROL TEAL/DARK SLATE SERIF */}
        <text
          x="100"
          y="124"
          textAnchor="middle"
          fill="#0c4a6e"
          fontFamily="'Times New Roman', Times, serif"
          fontWeight="bold"
          fontStyle="italic"
          fontSize="16"
          letterSpacing="0.3"
        >
          Cất cánh vươn cao
        </text>
      </svg>
    </div>
  );
};
