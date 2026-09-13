import type { FC } from 'react';
import type { SpinHistoryItem } from '../types';
import { ACTION_OPTIONS, RARITY_COLORS } from '../data/initialEmployees';
import { X, Trash2, History, Clock } from 'lucide-react';
import { soundService } from '../services/soundService';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpinHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryPanel: FC<HistoryPanelProps> = ({

  isOpen,
  onClose,
  history,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full sm:max-w-md h-full sm:h-[90vh] bg-slate-900 border-l sm:border border-slate-800 sm:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Orbitron',sans-serif] text-white tracking-wider">
                LỊCH SỬ MỞ HÒM
              </h3>
              <p className="text-xs text-slate-400">
                Lưu trữ các lượt quay nhân viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/40 border-b border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Tổng lượt quay: <strong className="text-cyan-400">{history.length}</strong>
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử quay?')) {
                  onClearAllHistory();
                  soundService.playTick(0.8);
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
            </button>
          )}
        </div>

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Clock className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa có lượt quay nào</p>
              <p className="text-xs text-slate-600 mt-1">
                Hãy nhấn nút QUAY NGAY để ghi nhận lượt đầu tiên!
              </p>
            </div>
          ) : (
            history.map((item) => {
              const actionConfig = ACTION_OPTIONS.find(a => a.type === item.action) || ACTION_OPTIONS[0];
              const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.milspec;

              return (
                <div
                  key={item.id}
                  className="relative group p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div 
                      className="w-11 h-11 rounded-full p-[2px] shrink-0"
                      style={{ background: `linear-gradient(135deg, ${actionConfig.glowColor}, ${rarity.accent})` }}
                    >
                      <img
                        src={item.employeeAvatar}
                        alt={item.employeeName}
                        className="w-full h-full object-cover rounded-full bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.employeeName)}&background=1e293b&color=38bdf8`;
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          #{item.roundNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-200">
                          {item.employeeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase"
                          style={{
                            borderColor: actionConfig.glowColor,
                            color: actionConfig.glowColor,
                            backgroundColor: `${actionConfig.glowColor}15`
                          }}
                        >
                          {item.actionLabel}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteHistoryItem(item.id);
                      soundService.playTick(0.8);
                    }}
                    title="Xóa lượt này"
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase font-mono transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
