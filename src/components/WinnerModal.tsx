import { useEffect } from 'react';
import type { FC } from 'react';
import type { Employee, ActionType } from '../types';
import { ACTION_OPTIONS, RARITY_COLORS } from '../data/initialEmployees';
import { RotateCw, X, Sparkles, Trophy, UserMinus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: Employee | null;
  action: ActionType;
  roundNumber: number;
  remainingCount?: number;
  autoEliminate?: boolean;
  onSpinAgain: () => void;
}

export const WinnerModal: FC<WinnerModalProps> = ({
  isOpen,
  onClose,
  winner,
  action,
  roundNumber,
  remainingCount,
  autoEliminate = true,
  onSpinAgain,
}) => {
  const currentAction = ACTION_OPTIONS.find(a => a.type === action) || ACTION_OPTIONS[0];
  const rarity = winner ? (RARITY_COLORS[winner.rarity] || RARITY_COLORS.special) : RARITY_COLORS.special;

  useEffect(() => {
    if (isOpen && winner) {
      // Launch celebratory CS2 style confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: [currentAction.glowColor, '#f59e0b', '#06b6d4'],
      });
      fire(0.2, {
        spread: 60,
        colors: ['#ffffff', currentAction.glowColor, '#ec4899'],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen, winner, currentAction]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      {/* Background glow flare */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-30 blur-[100px] animate-pulse"
        style={{ background: currentAction.glowColor }}
      />

      <div className="relative w-full max-w-md bg-slate-900/95 border-2 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center text-center p-6 md:p-8 animate-screenshake"
        style={{ borderColor: currentAction.glowColor }}
      >
        {/* Top bar with close button */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold">
              LẦN QUAY #{roundNumber}
            </span>
          </div>
          <button
            onClick={() => {
              soundService.playTick(0.9);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 animate-spin text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-black tracking-wider uppercase font-['Orbitron',sans-serif] bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
            🎉 KẾT QUẢ QUAY
          </h2>
          <Sparkles className="w-6 h-6 animate-spin text-amber-400" />
        </div>

        {/* Big Avatar with Neon Aura */}
        <div className="relative my-2">
          {/* Pulsing rings */}
          <div 
            className="absolute -inset-3 rounded-full opacity-60 blur-md animate-ping pointer-events-none"
            style={{ background: currentAction.glowColor }}
          />
          <div 
            className="w-36 h-36 md:w-44 md:h-44 rounded-full p-1.5 transition-all shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            style={{ 
              background: `linear-gradient(135deg, ${currentAction.glowColor}, #3b82f6, ${rarity.accent})` 
            }}
          >
            <img
              src={winner.avatar}
              alt={winner.name}
              className="w-full h-full object-cover rounded-full bg-slate-950 border-4 border-slate-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name)}&background=1e293b&color=38bdf8&size=200`;
              }}
            />
          </div>

          <span 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase font-mono tracking-wider border shadow-lg"
            style={{ 
              backgroundColor: '#090d16',
              borderColor: rarity.accent,
              color: rarity.accent
            }}
          >
            {rarity.name}
          </span>
        </div>

        {/* Winner Name */}
        <div className="mt-6 mb-3">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            NHÂN VIÊN ĐƯỢC CHỌN
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide font-['Orbitron',sans-serif] mt-1">
            🔥 {winner.name}
          </h3>
        </div>

        {/* Action Result Card */}
        <div 
          className="w-full p-4 rounded-2xl border-2 my-3 flex flex-col items-center justify-center transition-all shadow-lg"
          style={{
            borderColor: currentAction.glowColor,
            background: `radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.95), #0b0f19)`
          }}
        >
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">
            HÀNH ĐỘNG ÁP DỤNG
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider uppercase font-['Orbitron',sans-serif]"
              style={{ color: currentAction.glowColor }}
            >
              → {currentAction.label}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1">
            {currentAction.subtitle}
          </span>
        </div>

        {/* Elimination Alert */}
        {autoEliminate && (
          <div className="w-full mb-3 py-2 px-3 rounded-xl bg-slate-950/80 border border-rose-500/30 text-xs font-mono text-slate-300 flex items-center justify-center gap-2 shadow-inner">
            <UserMinus className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Đã loại <strong className="text-rose-400">{winner.name}</strong> khỏi ô quay tiếp theo
            </span>
            {remainingCount !== undefined && (
              <span className="text-cyan-400 font-bold">({remainingCount} còn lại)</span>
            )}
          </div>
        )}


        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={() => {
              soundService.playTick(1.2);
              onClose();
              onSpinAgain();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black font-['Orbitron',sans-serif] tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <RotateCw className="w-4 h-4" /> QUAY LẠI
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playTick(0.8);
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono tracking-wider uppercase text-sm border border-slate-700 transition-all cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
