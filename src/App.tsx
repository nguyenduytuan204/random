import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { Employee, ActionType, SpinHistoryItem, SoundSettings } from './types';
import { INITIAL_EMPLOYEES, ACTION_OPTIONS } from './data/initialEmployees';
import { ActionSelector } from './components/ActionSelector';
import { RandomRoller } from './components/RandomRoller';
import type { RandomRollerHandle } from './components/RandomRoller';
import { EmployeeCard } from './components/EmployeeCard';
import { EmployeeManager } from './components/EmployeeManager';
import { WinnerModal } from './components/WinnerModal';
import { HistoryPanel } from './components/HistoryPanel';
import { SoundController } from './components/SoundController';
import { soundService } from './services/soundService';
import { Settings, History, Users, Sparkles, CheckSquare, Square, Dices, UserMinus, RotateCcw } from 'lucide-react';

const STORAGE_KEYS = {
  EMPLOYEES: 'cs2_random_picker_employees',
  HISTORY: 'cs2_random_picker_history',
  SOUND: 'cs2_random_picker_sound',
  AUTO_ELIMINATE: 'cs2_random_picker_auto_eliminate',
};


export const App: FC = () => {

  // 1. Employees state with LocalStorage
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_EMPLOYEES;
  });

  // 2. Action selection
  const [selectedAction, setSelectedAction] = useState<ActionType>('CUT_SHIFT');

  // 3. History state with LocalStorage
  const [history, setHistory] = useState<SpinHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 4. Sound settings state with LocalStorage
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { enabled: true, volume: 0.7 };
  });

  // 5. Auto eliminate winner state
  const [autoEliminate, setAutoEliminate] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_ELIMINATE);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return true; // Default enabled as requested
  });

  // Modals state
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winner, setWinner] = useState<Employee | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const rollerRef = useRef<RandomRollerHandle>(null);

  // Sync autoEliminate to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_ELIMINATE, JSON.stringify(autoEliminate));
    } catch {
      // fallback
    }
  }, [autoEliminate]);


  // Sync sound settings to engine & localStorage
  useEffect(() => {
    soundService.setMuted(!soundSettings.enabled);
    soundService.setVolume(soundSettings.volume);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundSettings));
    } catch {
      // fallback
    }
  }, [soundSettings]);

  // Sync employees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch {
      // fallback
    }
  }, [employees]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // fallback
    }
  }, [history]);

  // Employee actions
  const handleToggleEmployee = (id: string) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, selected: !emp.selected } : emp))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setEmployees(prev => prev.map(emp => ({ ...emp, selected: select })));
    soundService.playTick(select ? 1.4 : 0.8);
  };

  const handleResetDefaults = () => {
    setEmployees(INITIAL_EMPLOYEES);
    soundService.playTick(1.2);
  };

  // Sound actions
  const handleToggleMute = () => {
    setSoundSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleChangeVolume = (volume: number) => {
    setSoundSettings(prev => ({ ...prev, volume, enabled: volume > 0 }));
  };

  // Spin complete handler
  const handleSpinEnd = (winnerEmployee: Employee) => {
    setIsSpinning(false);
    setWinner(winnerEmployee);

    const currentActionOption = ACTION_OPTIONS.find(a => a.type === selectedAction) || ACTION_OPTIONS[0];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newHistoryItem: SpinHistoryItem = {
      id: `history-${Date.now()}`,
      roundNumber: history.length + 1,
      employeeId: winnerEmployee.id,
      employeeName: winnerEmployee.name,
      employeeAvatar: winnerEmployee.avatar,
      action: selectedAction,
      actionLabel: currentActionOption.label,
      timestamp: timeStr,
      rarity: winnerEmployee.rarity,
    };

    setHistory(prev => [newHistoryItem, ...prev]);

    // Auto eliminate winner from subsequent spins
    if (autoEliminate) {
      setEmployees(prev =>
        prev.map(emp => (emp.id === winnerEmployee.id ? { ...emp, selected: false } : emp))
      );
    }

    setIsWinnerModalOpen(true);
  };


  // History operations
  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  const activeEmployeesCount = employees.filter(e => e.selected).length;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 bg-cs2-grid flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080b11]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-cyan-500 p-[2px] shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full bg-[#090d15] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-['Orbitron',sans-serif] tracking-wider uppercase bg-gradient-to-r from-amber-400 via-cyan-400 to-white bg-clip-text text-transparent">
                RANDOM PICKER
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase hidden sm:block">
                CS2 CASE OPENING EDITION • TEAM ROSTER
              </span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound Controller */}
            <SoundController
              isMuted={!soundSettings.enabled}
              volume={soundSettings.volume}
              onToggleMute={handleToggleMute}
              onChangeVolume={handleChangeVolume}
            />

            {/* Employee Manager Button */}
            <button
              onClick={() => {
                soundService.playTick(1.2);
                setIsManagerOpen(true);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-semibold text-xs tracking-wider uppercase font-mono transition-all shadow-md cursor-pointer"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Quản lý</span>
            </button>

            {/* History Button */}
            <button
              onClick={() => {
                soundService.playTick(1.2);
                setIsHistoryOpen(true);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 font-semibold text-xs tracking-wider uppercase font-mono transition-all shadow-md cursor-pointer"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Lịch sử</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 md:space-y-8 flex-1">
        {/* Step 1: Action Selector */}
        <section>
          <ActionSelector
            options={ACTION_OPTIONS}
            selectedAction={selectedAction}
            onSelectAction={setSelectedAction}
            disabled={isSpinning}
          />
        </section>

        {/* Step 2: CS2 Case Opening Roller */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm md:text-base font-bold tracking-widest text-slate-300 uppercase font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              2. Khu Vực Quay Mở Hòm
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Chính xác từng card • Easing CS2
            </span>
          </div>

          <RandomRoller
            ref={rollerRef}
            employees={employees}
            selectedAction={selectedAction}
            isSpinning={isSpinning}
            onSpinStart={() => setIsSpinning(true)}
            onSpinEnd={handleSpinEnd}
          />
        </section>

        {/* Step 3: Employee Roster Grid */}
        <section className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base md:text-lg font-bold tracking-wider font-['Orbitron',sans-serif] text-slate-200 uppercase">
                NHÂN VIÊN THAM GIA: <span className="text-cyan-400">{activeEmployeesCount}</span>/{employees.length}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={isSpinning}
                onClick={() => {
                  setAutoEliminate(prev => !prev);
                  soundService.playTick(1.2);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                  autoEliminate
                    ? 'bg-rose-950/50 border-rose-500/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                title="Tự động loại người trúng khỏi ô quay tiếp theo để không bị trùng"
              >
                <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                <span>Loại người trúng: {autoEliminate ? 'BẬT' : 'TẮT'}</span>
              </button>

              <button
                disabled={isSpinning}
                onClick={() => handleSelectAll(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Chọn tất cả
              </button>

              <button
                disabled={isSpinning}
                onClick={() => handleSelectAll(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" /> Bỏ chọn hết
              </button>
            </div>
          </div>

          {/* Alert if all employees have been eliminated / picked */}
          {activeEmployeesCount === 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/50 text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-center sm:text-left">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <span>Đã quay hết hoặc chưa có nhân viên nào được chọn tham gia!</span>
              </div>
              <button
                onClick={() => handleSelectAll(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase font-mono transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Kích hoạt lại tất cả
              </button>
            </div>
          )}

          {/* Grid Cards (Mobile 2 cols, Tablet 3-4 cols, Desktop 5-6 cols) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mt-4">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onToggle={handleToggleEmployee}
                onEdit={() => setIsManagerOpen(true)}
                disabled={isSpinning}
              />
            ))}
          </div>

          {/* Bottom Big CS2 Spin Button (Item 10) */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={isSpinning || activeEmployeesCount === 0}
              onClick={() => rollerRef.current?.spin()}
              className={`w-full sm:w-auto px-10 md:px-16 py-5 rounded-2xl font-black font-['Orbitron',sans-serif] tracking-widest text-xl md:text-2xl uppercase transition-all duration-300 flex items-center justify-center gap-4 cursor-pointer ${
                isSpinning || activeEmployeesCount === 0
                  ? 'bg-slate-800 text-slate-500 border-2 border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:shadow-[0_0_55px_rgba(245,158,11,1)] hover:scale-105 active:scale-95 border-2 border-amber-300'
              }`}
            >
              <Dices className={`w-8 h-8 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'ĐANG QUAY...' : '🎲 QUAY NGAY'}</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-mono text-slate-500">
          CS2 Case Opening Random Picker • Powered by React, Tailwind CSS & Web Audio API
        </div>
      </footer>

      {/* Modals & Panels */}
      <EmployeeManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        employees={employees}
        onUpdateEmployees={setEmployees}
        onResetDefaults={handleResetDefaults}
      />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearAllHistory={handleClearAllHistory}
      />

      <WinnerModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        winner={winner}
        action={selectedAction}
        roundNumber={history.length}
        remainingCount={employees.filter(e => e.id !== winner?.id && e.selected).length}
        autoEliminate={autoEliminate}
        onSpinAgain={() => {
          setIsWinnerModalOpen(false);
          const remainingAfter = employees.filter(e => e.selected).length;
          // If 0 remaining, re-select all
          if (remainingAfter === 0) {
            handleSelectAll(true);
          }
          setTimeout(() => {
            rollerRef.current?.spin();
          }, 300);
        }}
      />


    </div>
  );
};

export default App;
