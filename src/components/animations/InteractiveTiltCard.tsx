import React, { useRef, useState } from 'react';

interface InteractiveTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
  enableGlare?: boolean;
}

export const InteractiveTiltCard: React.FC<InteractiveTiltCardProps> = ({
  children,
  className = '',
  maxTiltDeg = 6,
  enableGlare = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    // Calculate tilt angles
    const tiltX = ((yPct - 50) / 50) * -maxTiltDeg;
    const tiltY = ((xPct - 50) / 50) * maxTiltDeg;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px)`,
      transition: 'transform 0.1s ease-out'
    });

    if (enableGlare) {
      setGlarePosition({
        x: xPct,
        y: yPct,
        opacity: 0.12
      });
    }
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    });
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={`relative will-change-transform ${className}`}
    >
      {/* Glare effect */}
      {enableGlare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden transition-opacity duration-300 z-10"
          style={{ opacity: glarePosition.opacity }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%)`
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
};
