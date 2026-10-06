import React, { useState, useEffect, useRef } from 'react';
import { useTransition, TRANSITION_PRESETS, TransitionType } from './TransitionContext';
import { Sparkles, Dices, Layers, ArrowUp, ChevronRight, X, Play } from 'lucide-react';

interface PageTransitionWrapperProps {
  currentPage: string;
  children: React.ReactNode;
}

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  currentPage,
  children
}) => {
  const {
    currentTransition,
    rollRandomTransition,
    setSpecificTransition,
    triggerPageTransition,
    isRandomMode,
    setIsRandomMode,
    showTransitionToast,
    setShowTransitionToast
  } = useTransition();

  const [activeAnimationClass, setActiveAnimationClass] = useState<string>(currentTransition.className);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  // Parallax & Scroll Depth States
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [parallaxY, setParallaxY] = useState<number>(0);

  // Khi currentPage thay đổi: Tự động đổi hiệu ứng ngẫu nhiên và re-render animation
  useEffect(() => {
    let nextClass = currentTransition.className;
    if (isRandomMode) {
      const next = rollRandomTransition();
      nextClass = next.className;
    }
    setActiveAnimationClass(nextClass);
    setAnimationKey(prev => prev + 1);

    // Tự động tắt toast sau 3.5s
    const toastTimer = setTimeout(() => {
      setShowTransitionToast(false);
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Xử lý Parallax Scrolling & Scroll Progress Bar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;

    if (scrollHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      setScrollProgress(pct);
    }

    // Parallax translation layer (di chuyển chậm hơn 35%)
    setParallaxY(scrollTop * 0.15);

    // Hiện nút cuộn lên đầu trang
    setShowBackToTop(scrollTop > 280);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Re-roll và test chuyển trang ngay lập tức
  const handleRerollAndPlay = () => {
    const next = rollRandomTransition();
    setActiveAnimationClass(next.className);
    setAnimationKey(prev => prev + 1);
  };

  const handleSelectPreset = (id: TransitionType) => {
    setSpecificTransition(id);
    const match = TRANSITION_PRESETS.find(p => p.id === id);
    if (match) {
      setActiveAnimationClass(match.className);
      setAnimationKey(prev => prev + 1);
    }
    setIsPickerOpen(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 1. SCROLL PROGRESS BAR (Độ sâu cuộn trang Parallax) */}
      <div className="sticky top-0 left-0 right-0 h-1 bg-transparent z-40 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. FLOATING TRANSITION TOAST / CONTROLLER CHIP */}
      <div className="fixed bottom-20 md:bottom-5 right-4 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Floating Mini Controller Badge */}
        <div className="flex items-center bg-white/90 hover:bg-white backdrop-blur-md border border-slate-300/80 shadow-lg hover:shadow-xl rounded-full p-1 pl-3 transition-all duration-200 group">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 mr-1.5 font-bold">
            <span className="text-sm">{currentTransition.icon}</span>
            <span className="hidden sm:inline text-slate-500 font-semibold text-[11px]">Chuyển trang:</span>
            <span className="text-slate-900 font-mono text-[11px] truncate max-w-[120px]">
              {currentTransition.name}
            </span>
          </div>

          {/* Nút xúc xắc đổi ngẫu nhiên */}
          <button
            type="button"
            onClick={handleRerollAndPlay}
            className="p-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition active:scale-90 cursor-pointer shadow-xs hover-shine"
            title="Đổi hiệu ứng chuyển trang ngẫu nhiên ngay lập tức (Randomize Transition)"
          >
            <Dices className="w-3.5 h-3.5 animate-spin-hover" />
          </button>

          {/* Nút mở danh sách các hiệu ứng */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer ml-0.5"
            title="Xem danh sách tất cả 8 hiệu ứng chuyển trang"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nút Cuộn Về Đầu Trang (Parallax Back to Top) */}
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-slate-900/90 hover:bg-orange-600 text-white shadow-xl backdrop-blur-xs transition-all duration-200 hover-lift active:scale-95 cursor-pointer"
            title="Cuộn mượt mà lên đầu trang"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. TRANSITION PRESETS POPOVER PICKER */}
      {isPickerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsPickerOpen(false)}
          />
          <div className="fixed bottom-36 md:bottom-20 right-4 z-50 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>BỘ HIỆU ỨNG CHUYỂN TRANG NGẪU NHIÊN</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
              <span>Chế độ ngẫu nhiên mỗi lần chuyển trang:</span>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isRandomMode}
                  onChange={e => setIsRandomMode(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <span>Bật ngẫu nhiên</span>
              </label>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {TRANSITION_PRESETS.map(preset => {
                const isActive = currentTransition.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer flex items-center justify-between border ${
                      isActive
                        ? 'bg-orange-50 border-orange-300 text-orange-950 shadow-2xs font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{preset.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {preset.description}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0 ml-2" />
                    ) : (
                      <Play className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRerollAndPlay}
              className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98 transition hover-shine"
            >
              <Dices className="w-4 h-4" />
              <span>Thử Ngay Hiệu Ứng Ngẫu Nhiên Mới</span>
            </button>
          </div>
        </>
      )}

      {/* 4. MAIN SCROLLABLE CONTENT WITH PARALLAX DEPTH LAYERS */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative bg-[#f8fafc]"
      >
        {/* Parallax Background Floating Elements (Di chuyển nhẹ nhàng theo tốc độ cuộn) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden opacity-30 select-none z-0"
          style={{ transform: `translateY(-${parallaxY}px)` }}
        >
          {/* Parallax Orb 1 */}
          <div className="absolute top-10 right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl parallax-float-slow" />
          {/* Parallax Orb 2 */}
          <div className="absolute top-48 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl parallax-float-reverse" />
          {/* Subtle Geometric Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        </div>

        {/* Dynamic Transition Animated View Container */}
        <div
          key={`${currentPage}-${animationKey}`}
          className={`relative z-10 w-full min-h-full ${activeAnimationClass}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
