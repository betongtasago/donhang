import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(username, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Đăng nhập không thành công.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c1017] via-[#141923] to-[#1c2436] p-4 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#18202f]/90 border border-slate-700/60 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative z-10 text-slate-200">
        {/* Brand Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-700/60">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e25822] text-white font-black text-xl tracking-wider shadow-lg shadow-orange-950/50 mx-auto">
            TSG
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              CÔNG TY CỔ PHẦN SX KD DV BÊ TÔNG TSG TNT
            </h1>
            <p className="text-xs text-orange-400 font-bold tracking-widest uppercase mt-1">
              DISPATCH CENTER • TRUNG TÂM ĐIỀU PHỐI BÊ TÔNG
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Vui lòng đăng nhập để truy cập hệ thống điều độ sản xuất & cấp xe bồn.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-400" />
              Tên đăng nhập
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              className="w-full px-3.5 py-2.5 bg-[#0f141e] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#0f141e] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-xl text-sm shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Đang kiểm tra bảo mật...</span>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-5 border-t border-slate-700/60 text-center text-[10px] text-slate-500">
          CÔNG TY CỔ PHẦN SX KD DV BÊ TÔNG TSG TNT • HỆ THỐNG ĐIỀU PHỐI NỘI BỘ
        </div>
      </div>
    </div>
  );
};
