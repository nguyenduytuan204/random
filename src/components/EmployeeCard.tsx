import type { FC, MouseEvent } from 'react';
import type { Employee } from '../types';
import { RARITY_COLORS } from '../data/initialEmployees';
import { Check, Edit3 } from 'lucide-react';
import { soundService } from '../services/soundService';

interface EmployeeCardProps {
  employee: Employee;
  onToggle: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  disabled?: boolean;
}

export const EmployeeCard: FC<EmployeeCardProps> = ({

  employee,
  onToggle,
  onEdit,
  disabled = false,
}) => {
  const rarity = RARITY_COLORS[employee.rarity] || RARITY_COLORS.milspec;

  const handleCardClick = (e: MouseEvent) => {
    if (disabled) return;
    // Don't trigger if clicked edit button
    if ((e.target as HTMLElement).closest('.edit-btn')) return;
    soundService.playTick(employee.selected ? 0.9 : 1.3);
    onToggle(employee.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl p-3 md:p-3.5 transition-all duration-300 cursor-pointer overflow-hidden border ${
        employee.selected
          ? `bg-slate-900/90 ${rarity.border} shadow-[0_0_20px_${rarity.glow}] scale-[1.01]`
          : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700'
      } ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      {/* Background subtle gradient */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${rarity.accent}, transparent 75%)`
        }}
      />

      {/* Top row: Checkbox & Edit action */}
      <div className="flex items-center justify-end mb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(employee);
              }}
              title="Chỉnh sửa nhân viên"
              className="edit-btn p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Custom Checkbox */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 border ${
              employee.selected
                ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'border-slate-700 bg-slate-900/80 text-transparent group-hover:border-slate-500'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Center Avatar */}
      <div className="flex flex-col items-center my-1 relative z-10">
        <div className="relative">
          <div 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all duration-300 ${
              employee.selected 
                ? 'ring-2 ring-orange-500/70 ring-offset-2 ring-offset-slate-950' 
                : 'opacity-70 group-hover:opacity-100'
            }`}
            style={{
              borderColor: rarity.accent,
              background: `linear-gradient(135deg, ${rarity.accent}, #0f172a)`
            }}
          >
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-full h-full object-cover rounded-full bg-slate-800"
              onError={(e) => {
                // Fallback avatar if URL fails
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=1e293b&color=38bdf8`;
              }}
            />
          </div>

          {employee.selected && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_#10b981]" />
          )}
        </div>

        {/* Employee Name */}
        <h4 className="mt-2.5 text-center text-sm md:text-base font-bold text-slate-200 tracking-wide font-['Rajdhani',sans-serif] line-clamp-1 group-hover:text-orange-300 transition-colors">
          {employee.name}
        </h4>


        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <span className="text-[11px] font-mono text-slate-400">
            {employee.selected ? '🟢 Sẵn sàng' : '⚪ Đã quay trúng / Tắt'}
          </span>
        </div>
      </div>




      {/* Rarity Bottom Stripe */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2.5px] transition-opacity"
        style={{ 
          backgroundColor: rarity.accent,
          opacity: employee.selected ? 1 : 0.2
        }}
      />
    </div>
  );
};
