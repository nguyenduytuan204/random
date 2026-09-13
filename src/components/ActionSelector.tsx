import type { FC } from 'react';
import type { ActionType, ActionOption } from '../types';
import { ShieldAlert, UserX, Clock, Flame } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ActionSelectorProps {
  options: ActionOption[];
  selectedAction: ActionType;
  onSelectAction: (action: ActionType) => void;
  disabled?: boolean;
}

export const ActionSelector: FC<ActionSelectorProps> = ({
  options,
  selectedAction,
  onSelectAction,
  disabled = false,
}) => {
  const getIcon = (type: ActionType) => {
    switch (type) {
      case 'SUPPORT':
        return <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />;
      case 'CUT_OFF':
        return <UserX className="w-6 h-6 md:w-7 md:h-7" />;
      case 'CUT_SHIFT':
        return <Clock className="w-6 h-6 md:w-7 md:h-7" />;
    }
  };

  const handleClick = (action: ActionType) => {
    if (disabled) return;
    soundService.playTick(1.4);
    onSelectAction(action);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          <h2 className="text-sm md:text-base font-bold tracking-widest text-slate-300 uppercase font-mono">
            1. Chọn Hành Động
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Kết quả áp dụng: <strong className="text-cyan-400">1 người may mắn</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {options.map((opt) => {
          const isSelected = selectedAction === opt.type;

          let activeStyles = '';
          if (isSelected) {
            if (opt.type === 'SUPPORT') {
              activeStyles = 'border-emerald-500 bg-gradient-to-b from-emerald-950/70 via-emerald-900/40 to-slate-900/90 text-emerald-300 glow-emerald scale-[1.02] shadow-[0_0_25px_rgba(16,185,129,0.35)]';
            } else if (opt.type === 'CUT_OFF') {
              activeStyles = 'border-rose-500 bg-gradient-to-b from-rose-950/70 via-rose-900/40 to-slate-900/90 text-rose-300 glow-rose scale-[1.02] shadow-[0_0_25px_rgba(244,63,94,0.35)]';
            } else {
              activeStyles = 'border-amber-400 bg-gradient-to-b from-amber-950/70 via-amber-900/40 to-slate-900/90 text-amber-300 glow-amber scale-[1.02] shadow-[0_0_25px_rgba(245,158,11,0.35)]';
            }
          } else {
            activeStyles = 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40 hover:text-slate-200';
          }

          return (
            <button
              key={opt.type}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(opt.type)}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 md:p-5 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group ${activeStyles} ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {/* Corner accent flair */}
              <div 
                className={`absolute top-0 right-0 w-16 h-16 pointer-events-none transition-opacity duration-300 ${
                  isSelected ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                }`}
                style={{
                  background: `radial-gradient(circle at top right, ${opt.glowColor}, transparent 70%)`
                }}
              />

              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold font-mono tracking-wider uppercase border ${
                  isSelected 
                    ? 'border-current bg-black/40' 
                    : 'border-slate-800 bg-slate-950/60 text-slate-500'
                }`}>
                  {opt.badge}
                </span>

                <div className={`p-2 rounded-xl transition-transform duration-300 ${
                  isSelected ? 'scale-110' : 'group-hover:scale-105 opacity-60'
                }`}>
                  {getIcon(opt.type)}
                </div>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-extrabold tracking-wide font-['Orbitron',sans-serif]">
                  {opt.label}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">
                  {opt.subtitle}
                </p>
              </div>

              {/* Active neon bottom bar */}
              {isSelected && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[3px] animate-pulse"
                  style={{ backgroundColor: opt.glowColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
