import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import type { Employee } from '../types';
import { RARITY_COLORS } from '../data/initialEmployees';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  CheckSquare, 
  Square, 
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import { soundService } from '../services/soundService';

interface EmployeeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onResetDefaults: () => void;
}

export const EmployeeManager: FC<EmployeeManagerProps> = ({
  isOpen,
  onClose,
  employees,
  onUpdateEmployees,
  onResetDefaults,
}) => {
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Add New Employee
  const handleAddEmployee = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const avatarUrl = newAvatar.trim() || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=1e293b&color=38bdf8&size=200`;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newName.trim(),
      avatar: avatarUrl,
      selected: true,
      rarity: 'classified',
      order: employees.length + 1,
      weight: 100,
    };

    onUpdateEmployees([...employees, newEmp]);

    setNewName('');
    setNewAvatar('');
    soundService.playTick(1.5);
  };

  // Handle Upload Image for New Employee
  const handleNewImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewAvatar(reader.result);
        soundService.playTick(1.2);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Upload Image for Existing Employee
  const handleExistingImageUpload = (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = employees.map(emp => 
          emp.id === activeUploadId ? { ...emp, avatar: reader.result as string } : emp
        );
        onUpdateEmployees(updated);
        soundService.playTick(1.2);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger File Dialog for existing employee
  const triggerImageChange = (empId: string) => {
    setActiveUploadId(empId);
    editFileInputRef.current?.click();
  };

  // Delete Employee
  const handleDelete = (id: string) => {
    if (employees.length <= 1) {
      alert('Phải giữ lại ít nhất 1 nhân viên trong danh sách!');
      return;
    }
    const updated = employees.filter(emp => emp.id !== id);
    onUpdateEmployees(updated);
    soundService.playTick(0.8);
  };

  // Toggle selection
  const handleToggle = (id: string) => {
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, selected: !emp.selected } : emp
    );
    onUpdateEmployees(updated);
  };

  // Select all / Deselect all
  const handleSelectAll = (select: boolean) => {
    const updated = employees.map(emp => ({ ...emp, selected: select }));
    onUpdateEmployees(updated);
    soundService.playTick(select ? 1.4 : 0.9);
  };

  // Move up/down order
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === employees.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const list = [...employees];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    // Update order sequence
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateEmployees(reordered);
    soundService.playTick(1.1);
  };

  // Save inline edit name
  const saveNameEdit = (id: string) => {
    if (editingName.trim()) {
      const updated = employees.map(emp => 
        emp.id === id ? { ...emp, name: editingName.trim() } : emp
      );
      onUpdateEmployees(updated);
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Hidden File Input for editing */}
      <input 
        type="file" 
        ref={editFileInputRef} 
        onChange={handleExistingImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Orbitron',sans-serif] text-slate-100 tracking-wider">
                QUẢN LÝ DANH SÁCH NHÂN VIÊN
              </h3>
              <p className="text-xs text-slate-400">
                Thêm, sửa tên, đổi ảnh đại diện và chọn nhân viên tham gia quay
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

        {/* Form: Add new employee */}
        <div className="p-4 sm:p-6 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Thêm Nhân Viên Mới
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Avatar Preview & Upload */}
              <div className="sm:col-span-2 flex items-center justify-center">
                <div 
                  onClick={() => addFileInputRef.current?.click()}
                  className="relative w-14 h-14 rounded-full border-2 border-dashed border-cyan-500/60 hover:border-cyan-400 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-800 group"
                  title="Click để chọn ảnh từ máy"
                >
                  {newAvatar ? (
                    <img src={newAvatar} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-mono text-center">
                    Đổi
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={addFileInputRef} 
                  onChange={handleNewImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Name Input */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Họ và tên nhân viên..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              {/* Image URL or Status */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Hoặc dán URL ảnh..."
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>
          </form>
        </div>


        {/* Batch Actions & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            Tổng số: <strong className="text-slate-200">{employees.length}</strong> | 
            Đang chọn quay: <strong className="text-cyan-400">{employees.filter(e => e.selected).length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Chọn tất cả
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" /> Bỏ chọn hết
            </button>
            <button
              onClick={() => {
                if (confirm('Khôi phục lại danh sách nhân viên mặc định ban đầu?')) {
                  onResetDefaults();
                }
              }}
              title="Khôi phục mặc định"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Mặc định
            </button>
          </div>
        </div>

        {/* Employees List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 max-h-[420px]">
          {employees.map((emp, index) => {
            const rarity = RARITY_COLORS[emp.rarity] || RARITY_COLORS.milspec;

            return (
              <div
                key={emp.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  emp.selected 
                    ? 'bg-slate-800/80 border-slate-700' 
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Left: Reorder & Checkbox */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === employees.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="checkbox"
                    checked={emp.selected}
                    onChange={() => handleToggle(emp.id)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-600 cursor-pointer"
                  />

                  {/* Avatar with click to change image */}
                  <div 
                    onClick={() => triggerImageChange(emp.id)}
                    className="relative w-11 h-11 rounded-full p-[2px] cursor-pointer group shrink-0"
                    style={{ background: `linear-gradient(135deg, ${rarity.accent}, #0f172a)` }}
                    title="Click để đổi ảnh nhân viên"
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-full h-full object-cover rounded-full bg-slate-900"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Name or Edit Input */}
                  <div>
                    {editingId === emp.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveNameEdit(emp.id)}
                          autoFocus
                          className="px-2 py-1 bg-slate-950 border border-cyan-400 rounded text-sm text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveNameEdit(emp.id)}
                          className="px-2 py-1 bg-cyan-500 text-black text-xs font-bold rounded"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => {
                            setEditingId(emp.id);
                            setEditingName(emp.name);
                          }}
                          className="text-sm font-bold text-slate-200 hover:text-cyan-300 cursor-pointer"
                          title="Click để đổi tên"
                        >
                          {emp.name}
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 block">
                      Thứ tự: #{index + 1} • {emp.selected ? 'Sẵn sàng quay' : 'Tạm tắt'}
                    </span>


                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerImageChange(emp.id)}
                    className="p-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded-lg flex items-center gap-1 transition-colors"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Đổi ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(emp.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Xóa nhân viên"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
