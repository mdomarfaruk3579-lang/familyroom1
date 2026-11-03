import { Member } from '../../../types';

export type EraId = 1 | 2 | 3 | 4;

export interface EraInfo {
  id: EraId;
  name: string;
  nameBn: string;
  period: string;
  description: string;
  groundColor: number;
  roadColor: number;
  fogColor: number;
  skyColor: number;
  ambientColor: number;
  obstacleTypes: string[];
}

export interface RunnerConfig {
  gender: 'male' | 'female';
  hairStyle: 'short' | 'curly' | 'long' | 'classic';
  hairColor: string;
  outfit: 'panjabi' | 'shirt_pant' | 'saree' | 'salwar' | 'casual';
  outfitColor: string;
  skinTone: string;
  faceDataUrl: string | null;
  faceScale: number;
  faceOffsetY: number;
  brightness: number;
}

export interface GenerationRunner {
  eraId: EraId;
  generationTitle: string;
  eraName: string;
  member: Member | null;
  config: RunnerConfig;
}

export type GamePhase = 
  | 'intro'
  | 'customize'
  | 'relay_select'
  | 'playing'
  | 'baton_pass'
  | 'trunk_open'
  | 'game_over';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface UnlockedMemory {
  title: string;
  era: string;
  photoUrl?: string;
  story: string;
  author: string;
}
