import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTransition } from './TransitionContext';
import { CheckCircle2, Truck, Sparkles, Shield, ArrowRight, Activity, Radio } from 'lucide-react';

export const PostLoginWelcomeModal: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    showPostLoginSplash,
    dismissPostLoginSplash,
    currentTransition,
    rollRandomTransition
  } = useTransition();

  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!showPostLoginSplash) {
      setProgress(0);
      return;
    }

    // Thanh tiến trình chạy mượt mà trong 1.1s
    const startTime = Date.now();
    const duration = 1200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        dismissPostLoginSplash();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [showPostLoginSplash, dismissPostLoginSplash]);

  if (!showPostLoginSplash || !currentUser) return null;

  return (
    <div
      onClick={dismissPostLoginSplash}
      className="fixed inset-0 z-50 bg-[#090d16]/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer select-none animate-in fade-in duration-200"
    >
      {/* Decorative ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Welcome Card */}
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#141b2a]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative z-10 space-y-6 animate-in zoom-in-95 duration-250 hover-lift"
      >
        {/* Brand Lockup & Dispatch Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e25822] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-orange-950/60 shrink-0">
              TSG
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-orange-400 font-bold uppercase">
                DISPATCH CENTER • TRUNG TÂM ĐIỀU PHỐI
              </div>
              <h3 className="text-sm font-black text-white tracking-wide">
                BÊ TÔNG TÂN NHẬT NGUYỆT (TSG-TNT)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Trực tuyến</span>
          </div>
        </div>

        {/* User Welcome Information */}
        <div className="flex items-center gap-4 bg-[#0d131f]/90 p-4 rounded-2xl border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            {currentUser.fullName.split(' ').pop()?.charAt(0) || 'U'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-400 font-medium">
              Xác thực danh tính thành công
            </div>
            <h4 className="text-base sm:text-lg font-black text-white truncate">
              {currentUser.fullName}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50 font-bold text-[10px]">
                {currentUser.roleTitle || currentUser.role}
              </span>
              <span className="text-slate-400 text-[11px]">
                Trạm: <strong>{currentUser.plantLocation || 'Tây Ninh'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Selected Random Transition Preview */}
        <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-900/90 p-3.5 rounded-2xl border border-blue-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <span>{currentTransition.icon}</span>
              <span>HIỆU ỨNG CHUYỂN TRANG NGẪU NHIÊN:</span>
            </div>
            <button
              type="button"
              onClick={rollRandomTransition}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-800/60 hover:bg-blue-700 text-blue-200 transition cursor-pointer"
              title="Đổi hiệu ứng ngẫu nhiên khác"
            >
              🎲 Đổi hiệu ứng
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-black text-sm text-white flex items-center gap-2">
              <span className="text-amber-400 font-mono">[{currentTransition.name}]</span>
              <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                ({currentTransition.nameEn})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {currentTransition.description}
          </p>
        </div>

        {/* Progress & Enter Button */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-orange-400" />
                <span>Đang khởi tạo không gian điều hành...</span>
              </span>
              <span className="font-mono font-bold text-white">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={dismissPostLoginSplash}
            className="w-full py-3 bg-[#e25822] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 hover-shine"
          >
            <span>Vào Bàn Điều Phối Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-center text-slate-400">
            * Bấm bất kỳ đâu hoặc phím bất kỳ để chuyển trang ngay lập tức
          </p>
        </div>
      </div>
    </div>
  );
};
