export type GameMode = 'classic' | 'snakes';

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'orange';

export interface LudoPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  isAi: boolean;
  avatar?: string;
  memberId?: string;
  rank?: number; // 1st, 2nd, 3rd, etc.
}

export interface ClassicToken {
  id: number; // 0, 1, 2, 3
  playerId: string;
  position: number; // -1: Yard, 0..51: Main path, 52..57: Home stretch, 57: Finished
  hasFinished: boolean;
}

export interface SnakeOrLadder {
  start: number;
  end: number;
  type: 'snake' | 'ladder';
  bengaliTitle: string;
}

export const SNAKES_AND_LADDERS: SnakeOrLadder[] = [
  // Ladders (Upward virtues)
  { start: 4, end: 14, type: 'ladder', bengaliTitle: 'বাবার দোয়া' },
  { start: 9, end: 31, type: 'ladder', bengaliTitle: 'মায়ের স্নেহ' },
  { start: 20, end: 38, type: 'ladder', bengaliTitle: 'পরোপকার' },
  { start: 28, end: 84, type: 'ladder', bengaliTitle: 'বংশের সম্মান' },
  { start: 40, end: 59, type: 'ladder', bengaliTitle: 'সত্যবাদিতা' },
  { start: 51, end: 67, type: 'ladder', bengaliTitle: 'ভ্রাতৃত্ববোধ' },
  { start: 63, end: 81, type: 'ladder', bengaliTitle: 'গুরুজনদের শ্রদ্ধা' },
  { start: 71, end: 91, type: 'ladder', bengaliTitle: 'জ্ঞানার্জন' },

  // Snakes (Downward pitfalls)
  { start: 17, end: 7, type: 'snake', bengaliTitle: 'অহংকার' },
  { start: 54, end: 34, type: 'snake', bengaliTitle: 'ঝগড়া-বিবাদ' },
  { start: 62, end: 19, type: 'snake', bengaliTitle: 'মিথ্যা বলা' },
  { start: 64, end: 60, type: 'snake', bengaliTitle: 'অলসতা' },
  { start: 87, end: 24, type: 'snake', bengaliTitle: 'হিংসা' },
  { start: 93, end: 73, type: 'snake', bengaliTitle: 'রাগ ও ক্রোধ' },
  { start: 95, end: 75, type: 'snake', bengaliTitle: 'বিশ্বাসঘাতকতা' },
  { start: 99, end: 78, type: 'snake', bengaliTitle: 'অকৃতজ্ঞতা' },
];

export const COLOR_CONFIGS: Record<PlayerColor, {
  nameBn: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
  lightHex: string;
  darkHex: string;
  ringClass: string;
}> = {
  red: {
    nameBn: 'লাল',
    bgClass: 'bg-rose-600',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-600',
    hex: '#e11d48',
    lightHex: '#ffe4e6',
    darkHex: '#9f1239',
    ringClass: 'ring-rose-500',
  },
  green: {
    nameBn: 'সবুজ',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-600',
    hex: '#059669',
    lightHex: '#d1fae5',
    darkHex: '#065f46',
    ringClass: 'ring-emerald-500',
  },
  yellow: {
    nameBn: 'হলুদ',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500',
    hex: '#d97706',
    lightHex: '#fef3c7',
    darkHex: '#92400e',
    ringClass: 'ring-amber-500',
  },
  blue: {
    nameBn: 'নীল',
    bgClass: 'bg-blue-600',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-600',
    hex: '#2563eb',
    lightHex: '#dbeafe',
    darkHex: '#1e40af',
    ringClass: 'ring-blue-500',
  },
  purple: {
    nameBn: 'বেগুনি',
    bgClass: 'bg-purple-600',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-600',
    hex: '#9333ea',
    lightHex: '#f3e8ff',
    darkHex: '#6b21a8',
    ringClass: 'ring-purple-500',
  },
  orange: {
    nameBn: 'কমলা',
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-600',
    hex: '#ea580c',
    lightHex: '#ffedd5',
    darkHex: '#9a3412',
    ringClass: 'ring-orange-500',
  },
};
