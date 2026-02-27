import { Player, PlayerStats } from '../types/squad';

// Utility to get stat color based on value
export const getStatColor = (value: number): string => {
  if (value >= 80) return 'text-[#4ade80]'; // green
  if (value >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

// Calculate average stats
export const calculateAverageStats = (players: (Player | null)[]): PlayerStats => {
  const validPlayers = players.filter((p): p is Player => p !== null);
  if (validPlayers.length === 0) {
    return { pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0 };
  }

  const totals = validPlayers.reduce(
    (acc, player) => ({
      pace: acc.pace + player.stats.pace,
      shooting: acc.shooting + player.stats.shooting,
      passing: acc.passing + player.stats.passing,
      dribbling: acc.dribbling + player.stats.dribbling,
      defending: acc.defending + player.stats.defending,
      physical: acc.physical + player.stats.physical
    }),
    { pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0 }
  );

  return {
    pace: Math.round(totals.pace / validPlayers.length),
    shooting: Math.round(totals.shooting / validPlayers.length),
    passing: Math.round(totals.passing / validPlayers.length),
    dribbling: Math.round(totals.dribbling / validPlayers.length),
    defending: Math.round(totals.defending / validPlayers.length),
    physical: Math.round(totals.physical / validPlayers.length)
  };
};

// Calculate squad rating
export const calculateSquadRating = (players: (Player | null)[]): number => {
  const validPlayers = players.filter((p): p is Player => p !== null);
  if (validPlayers.length === 0) return 0;
  const totalRating = validPlayers.reduce((sum, player) => sum + player.rating, 0);
  return Math.round((totalRating / validPlayers.length) * 10) / 10;
};

// Calculate total price
export const calculateTotalPrice = (players: (Player | null)[]): number => {
  const validPlayers = players.filter((p): p is Player => p !== null);
  return validPlayers.reduce((sum, player) => sum + player.price, 0);
};

// Calculate average height
export const calculateAverageHeight = (players: (Player | null)[]): number => {
  const validPlayers = players.filter((p): p is Player => p !== null);
  if (validPlayers.length === 0) return 0;
  const totalHeight = validPlayers.reduce((sum, player) => sum + player.height, 0);
  return Math.round(totalHeight / validPlayers.length);
};

// Count position types
export const countPositions = (players: (Player | null)[]) => {
  const validPlayers = players.filter((p): p is Player => p !== null);
  return {
    gk: validPlayers.filter(p => p.position === 'GK').length,
    def: validPlayers.filter(p => ['LB', 'CB', 'RB'].includes(p.position)).length,
    mid: validPlayers.filter(p => ['LM', 'CM', 'CDM', 'CAM', 'RM'].includes(p.position)).length,
    fwd: validPlayers.filter(p => ['LW', 'ST', 'RW'].includes(p.position)).length
  };
};
