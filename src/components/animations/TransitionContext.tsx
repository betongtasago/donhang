import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type TransitionType =
  | 'zoom-glow'
  | 'slide-spring'
  | 'perspective-tilt'
  | 'blur-dissolve'
  | 'curtain-reveal'
  | 'elastic-rise'
  | 'flip-horizon'
  | 'prism-sweep';

export interface TransitionMetadata {
  id: TransitionType;
  name: string;
  nameEn: string;
  className: string;
  icon: string;
  description: string;
}

export const TRANSITION_PRESETS: TransitionMetadata[] = [
  {
    id: 'zoom-glow',
    name: 'Phóng To & Tỏa Sáng',
    nameEn: 'Zoom & Glow',
    className: 'transition-zoom-glow',
    icon: '✨',
    description: 'Phóng đại mượt mà từ chiều sâu kết hợp ánh sáng tỏa nhẹ'
  },
  {
    id: 'slide-spring',
    name: 'Trượt Quán Tính Bật Nhẹ',
    nameEn: 'Slide Spring',
    className: 'transition-slide-spring',
    icon: '🚀',
    description: 'Trượt ngang với gia tốc đàn hồi vượt ngưỡng tự nhiên'
  },
  {
    id: 'perspective-tilt',
    name: 'Phối Cảnh 3D Horizon',
    nameEn: '3D Perspective Tilt',
    className: 'transition-perspective-tilt',
    icon: '📐',
    description: 'Nghiêng 3D trục tọa độ và cân bằng lại trạng thái phẳng'
  },
  {
    id: 'blur-dissolve',
    name: 'Hòa Tan Mờ Nghệ Thuật',
    nameEn: 'Cinematic Blur Dissolve',
    className: 'transition-blur-dissolve',
    icon: '🌫️',
    description: 'Hiệu ứng motion blur điện ảnh làm tan biến và hiện rõ nét'
  },
  {
    id: 'curtain-reveal',
    name: 'Màn Trập Thác Nước',
    nameEn: 'Curtain Cascade Reveal',
    className: 'transition-curtain-reveal',
    icon: '🌊',
    description: 'Màn trập mở từ trên xuống dưới theo đường cong gradient'
  },
  {
    id: 'elastic-rise',
    name: 'Nâng Lên Đàn Hồi',
    nameEn: 'Elastic Spring Rise',
    className: 'transition-elastic-rise',
    icon: '⚡',
    description: 'Nâng cao từ dưới lên với độ nảy nhẹ nhàng tinh tế'
  },
  {
    id: 'flip-horizon',
    name: 'Lật Trang 3D Đa Chiều',
    nameEn: 'Horizon 3D Flip',
    className: 'transition-flip-horizon',
    icon: '🔄',
    description: 'Lật mặt phẳng không gian 3D mở ra màn hình mới'
  },
  {
    id: 'prism-sweep',
    name: 'Quét Lăng Kính Ánh Sáng',
    nameEn: 'Prism Shimmer Sweep',
    className: 'transition-prism-sweep',
    icon: '🌈',
    description: 'Vệt sáng tinh khôi quét ngang bề mặt giao diện'
  }
];

interface TransitionContextType {
  currentTransition: TransitionMetadata;
  isTransitioning: boolean;
  isRandomMode: boolean;
  setIsRandomMode: (value: boolean) => void;
  rollRandomTransition: () => TransitionMetadata;
  setSpecificTransition: (id: TransitionType) => void;
  triggerPageTransition: (callback?: () => void) => void;
  showTransitionToast: boolean;
  setShowTransitionToast: (value: boolean) => void;
  showPostLoginSplash: boolean;
  dismissPostLoginSplash: () => void;
  triggerLoginWelcomeSequence: () => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lấy ngẫu nhiên 1 hiệu ứng ban đầu
  const [currentTransition, setCurrentTransition] = useState<TransitionMetadata>(() => {
    const randomIndex = Math.floor(Math.random() * TRANSITION_PRESETS.length);
    return TRANSITION_PRESETS[randomIndex];
  });

  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isRandomMode, setIsRandomMode] = useState<boolean>(true);
  const [showTransitionToast, setShowTransitionToast] = useState<boolean>(false);
  const [showPostLoginSplash, setShowPostLoginSplash] = useState<boolean>(false);

  // Đổi ngẫu nhiên một hiệu ứng khác hiệu ứng hiện tại
  const rollRandomTransition = useCallback((): TransitionMetadata => {
    const remaining = TRANSITION_PRESETS.filter(t => t.id !== currentTransition.id);
    const chosen = remaining[Math.floor(Math.random() * remaining.length)] || TRANSITION_PRESETS[0];
    setCurrentTransition(chosen);
    setShowTransitionToast(true);
    return chosen;
  }, [currentTransition]);

  // Chọn hiệu ứng cụ thể
  const setSpecificTransition = useCallback((id: TransitionType) => {
    const match = TRANSITION_PRESETS.find(t => t.id === id);
    if (match) {
      setCurrentTransition(match);
      setShowTransitionToast(true);
    }
  }, []);

  // Kích hoạt chu kỳ chuyển trang
  const triggerPageTransition = useCallback((callback?: () => void) => {
    if (isRandomMode) {
      rollRandomTransition();
    }
    setIsTransitioning(true);
    if (callback) {
      callback();
    }
    // Sau khi animation hoàn tất, đặt lại trạng thái
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [isRandomMode, rollRandomTransition]);

  // Chuỗi chào mừng sau khi đăng nhập (Post-Login Sequence)
  const triggerLoginWelcomeSequence = useCallback(() => {
    // Luôn chọn một hiệu ứng ngẫu nhiên mới nhất cho lần đăng nhập
    rollRandomTransition();
    setShowPostLoginSplash(true);
  }, [rollRandomTransition]);

  const dismissPostLoginSplash = useCallback(() => {
    setShowPostLoginSplash(false);
  }, []);

  return (
    <TransitionContext.Provider
      value={{
        currentTransition,
        isTransitioning,
        isRandomMode,
        setIsRandomMode,
        rollRandomTransition,
        setSpecificTransition,
        triggerPageTransition,
        showTransitionToast,
        setShowTransitionToast,
        showPostLoginSplash,
        dismissPostLoginSplash,
        triggerLoginWelcomeSequence
      }}
    >
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};
