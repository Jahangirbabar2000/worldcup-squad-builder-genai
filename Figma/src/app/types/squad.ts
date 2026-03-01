export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  country: string;
  countryFlag: string;
  club: string;
  age: number;
  stats: PlayerStats;
  price: number; // in millions
  height: number; // in cm
  locked?: boolean;
  justification?: string;
}

export type Formation = '4-3-3' | '3-5-2' | '4-4-2' | '4-2-3-1' | '3-4-3';
export type BuildUpStyle = 'Balanced' | 'Counter-Attack' | 'Short Passing';
export type DefensiveApproach = 'Balanced' | 'Deep Block' | 'High Press' | 'Aggressive';

export interface SquadSlot {
  position: string;
  player: Player | null;
  x: number; // percentage from left
  y: number; // percentage from top
  alternatives?: Player[];
}

export interface SquadConstraints {
  minGK: number;
  minDEF: number;
  minMID: number;
  minFWD: number;
}

export type PipelineStage = 'Retrieving' | 'Filtering' | 'Constraining' | 'Justifying' | 'Complete';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export interface ReplacementCandidate {
  player: Player;
  reason: string;
}
