import { SquadSlot, SquadConstraints, Player } from './types/squad';

const API_BASE = 'http://localhost:8000';

export interface BuildSquadRequest {
  prompt: string;
  formation: string;
  buildUpStyle: string;
  defensiveApproach: string;
  budget: number;
  budgetEnabled: boolean;
  constraints: SquadConstraints;
}

export interface BuildSquadResponse {
  pitchSlots: SquadSlot[];
  benchSlots: SquadSlot[];
  reserveSlots: SquadSlot[];
  strategyReasoning: string;
  aiMessage: string;
  excluded: Array<{ short_name: string; reason: string }>;
  /** Set by chat endpoint: AI-inferred settings so the panel can reflect them */
  formation?: string;
  buildUpStyle?: string;
  defensiveApproach?: string;
  budgetEnabled?: boolean;
  budget?: number;
}

export interface ReplacementCandidate {
  player: Player;
  reason: string;
}

export async function buildSquad(request: BuildSquadRequest): Promise<BuildSquadResponse> {
  const response = await fetch(`${API_BASE}/api/build-squad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}

export async function sendChat(
  message: string,
  formation: string,
  buildUpStyle: string,
  defensiveApproach: string,
  budget: number,
  budgetEnabled: boolean,
  constraints: SquadConstraints,
): Promise<BuildSquadResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      formation,
      buildUpStyle,
      defensiveApproach,
      budget,
      budgetEnabled,
      constraints,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}

export async function searchPlayers(
  position?: string,
  query?: string,
  limit: number = 20,
): Promise<Player[]> {
  const params = new URLSearchParams();
  if (position) params.set('position', position);
  if (query) params.set('query', query);
  params.set('limit', String(limit));
  const response = await fetch(`${API_BASE}/api/search-players?${params}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}

export async function getReplacementCandidates(
  position: string,
  currentPlayerId: string,
  currentSquadIds: string[],
): Promise<ReplacementCandidate[]> {
  const response = await fetch(`${API_BASE}/api/replace-player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position, currentPlayerId, currentSquadIds }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}
