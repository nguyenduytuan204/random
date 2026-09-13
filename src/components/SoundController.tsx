import { useState } from 'react';
import type { FC, ChangeEvent } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { soundService } from '../services/soundService';

interface SoundControllerProps {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
}

export const SoundController: FC<SoundControllerProps> = ({

  isMuted,
  volume,
  onToggleMute,
  onChangeVolume,
}) => {
  const [showSlider, setShowSlider] = useState(false);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5 text-red-400" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5 text-cyan-400" />;
    return <Volume2 className="w-5 h-5 text-cyan-400" />;
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeVolume(val);
    if (isMuted && val > 0) {
      onToggleMute();
    }
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
          isMuted
            ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/50'
            : 'bg-slate-900/80 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
        }`}
      >
        {getVolumeIcon()}
        <span className="text-xs font-semibold tracking-wider font-mono">
          {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
        </span>
      </button>

      {/* Popover Slider on Hover / Active */}
      {showSlider && (
        <div className="absolute top-full mt-2 right-0 z-50 p-3 bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 min-w-[140px] animate-fadeIn">
          <div className="flex justify-between w-full text-[11px] font-mono text-slate-400">
            <span>Âm lượng</span>
            <span className="text-cyan-400 font-bold">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <button
            onClick={() => soundService.playTick(1.2)}
            className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-mono cursor-pointer"
          >
            Test âm thanh
          </button>
        </div>
      )}
    </div>
  );
};
