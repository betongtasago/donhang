import React from 'react';

interface TsgLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const TsgLogo: React.FC<TsgLogoProps> = ({
  className = 'w-24 h-auto',
  width,
  height
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`} style={{ width, height }}>
      <svg
        viewBox="0 0 240 160"
        className="w-full h-auto max-h-[75px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tsgGlobeGrad" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#034694" />
          </linearGradient>
          <linearGradient id="tsgSwooshGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
        </defs>

        {/* 1. TOP SPHERE & FLIGHT SWOOSHES WITH 3 AIRPLANES */}
        <g transform="translate(10, 0)">
          {/* Outer orbital arc encircling the top */}
          <path
            d="M 60 72 C 35 68, 20 52, 28 35 C 38 18, 70 12, 100 16 C 118 19, 134 26, 142 34 C 124 23, 85 18, 55 24 C 34 29, 26 40, 36 50 C 44 58, 62 62, 80 62"
            fill="url(#tsgGlobeGrad)"
          />

          {/* Central Globe Core Spherical Curves */}
          <path
            d="M 52 74 C 38 70, 28 60, 30 48 C 32 40, 40 33, 52 28 C 45 35, 42 44, 46 51 C 52 61, 72 66, 96 66 C 120 66, 138 60, 144 52 C 146 56, 142 61, 134 66 C 118 76, 80 78, 52 74 Z"
            fill="#034694"
          />

          {/* Dynamic lower globe bowl */}
          <path
            d="M 38 52 C 40 65, 54 75, 75 80 C 95 85, 120 83, 135 74 C 142 69, 146 62, 147 55 C 141 62, 130 68, 114 71 C 92 75, 68 73, 52 64 C 44 59, 40 55, 38 52 Z"
            fill="url(#tsgGlobeGrad)"
          />

          {/* Streamlines / Contrails shooting up to the right */}
          {/* Upper contrail leading to main top airplane */}
          <path
            d="M 44 48 C 55 36, 75 30, 105 32 C 130 34, 155 26, 172 16 L 175 18 C 156 30, 128 39, 102 37 C 76 35, 55 42, 44 48 Z"
            fill="#0284c7"
          />

          {/* Middle main contrail leading to center airplane */}
          <path
            d="M 48 57 C 65 47, 95 42, 128 42 C 150 42, 168 36, 185 24 L 188 26 C 168 40, 146 47, 122 47 C 90 47, 62 53, 48 57 Z"
            fill="url(#tsgSwooshGrad)"
          />

          {/* Lower contrail leading to bottom trailing airplane */}
          <path
            d="M 58 66 C 80 58, 110 54, 140 54 C 160 54, 178 48, 192 38 L 194 40 C 178 52, 156 59, 134 59 C 104 59, 75 63, 58 66 Z"
            fill="#034694"
          />

          {/* AIRPLANE 1 (Top leading jet) */}
          <g transform="translate(170, 13) rotate(32) scale(0.95)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#0284c7"
            />
          </g>

          {/* AIRPLANE 2 (Top small escort jet) */}
          <g transform="translate(152, 22) rotate(32) scale(0.65)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#0ea5e9"
            />
          </g>

          {/* AIRPLANE 3 (Trailing escort jet below) */}
          <g transform="translate(182, 34) rotate(32) scale(0.7)">
            <path
              d="M 12 0 L -6 -8 L -3 -2 L -12 -3 L -10 0 L -12 3 L -3 2 L -6 8 Z"
              fill="#0284c7"
            />
          </g>
        </g>

        {/* 2. TEXT "TSG-TNT" IN BOLD CRIMSON RED */}
        <text
          x="120"
          y="126"
          textAnchor="middle"
          fill="#dc2626"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="900"
          fontSize="41"
          letterSpacing="1.5"
        >
          TSG-TNT
        </text>

        {/* 3. SLOGAN "Cất cánh vươn cao" IN PETROL BLUE/TEAL SERIF */}
        <text
          x="120"
          y="152"
          textAnchor="middle"
          fill="#0f4c5c"
          fontFamily="'Times New Roman', Times, serif"
          fontWeight="bold"
          fontStyle="italic"
          fontSize="18"
          letterSpacing="0.5"
        >
          Cất cánh vươn cao
        </text>
      </svg>
    </div>
  );
};
