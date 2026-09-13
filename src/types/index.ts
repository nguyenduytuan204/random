export type Rarity = 'milspec' | 'restricted' | 'classified' | 'covert' | 'special';

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
  rarity: Rarity;
  order: number;
}

export type ActionType = 'SUPPORT' | 'CUT_OFF' | 'CUT_SHIFT';

export interface ActionOption {
  type: ActionType;
  label: string;
  subtitle: string;
  icon: string;
  badge: string;
  colorClass: string;
  bgGlowClass: string;
  borderClass: string;
  textClass: string;
  glowColor: string;
}

export interface SpinHistoryItem {
  id: string;
  roundNumber: number;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  action: ActionType;
  actionLabel: string;
  timestamp: string;
  rarity: Rarity;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
}
