import { Player, Formation, SquadSlot, ReplacementCandidate } from '../types/squad';

// Mock player database
export const playerDatabase: Player[] = [
  {
    id: '1',
    name: 'Lionel Messi',
    position: 'RW',
    rating: 91,
    country: 'Argentina',
    countryFlag: '🇦🇷',
    club: 'Inter Miami',
    age: 36,
    stats: { pace: 85, shooting: 92, passing: 91, dribbling: 95, defending: 34, physical: 65 },
    price: 45,
    height: 170
  },
  {
    id: '2',
    name: 'Kylian Mbappé',
    position: 'ST',
    rating: 92,
    country: 'France',
    countryFlag: '🇫🇷',
    club: 'Real Madrid',
    age: 25,
    stats: { pace: 97, shooting: 89, passing: 80, dribbling: 92, defending: 36, physical: 77 },
    price: 180,
    height: 178
  },
  {
    id: '3',
    name: 'Kevin De Bruyne',
    position: 'CAM',
    rating: 91,
    country: 'Belgium',
    countryFlag: '🇧🇪',
    club: 'Manchester City',
    age: 32,
    stats: { pace: 76, shooting: 86, passing: 93, dribbling: 88, defending: 64, physical: 78 },
    price: 85,
    height: 181
  },
  {
    id: '4',
    name: 'Virgil van Dijk',
    position: 'CB',
    rating: 90,
    country: 'Netherlands',
    countryFlag: '🇳🇱',
    club: 'Liverpool',
    age: 32,
    stats: { pace: 77, shooting: 60, passing: 71, dribbling: 72, defending: 91, physical: 86 },
    price: 75,
    height: 193
  },
  {
    id: '5',
    name: 'Alisson Becker',
    position: 'GK',
    rating: 89,
    country: 'Brazil',
    countryFlag: '🇧🇷',
    club: 'Liverpool',
    age: 31,
    stats: { pace: 50, shooting: 13, passing: 82, dribbling: 48, defending: 39, physical: 90 },
    price: 55,
    height: 193
  },
  {
    id: '6',
    name: 'Erling Haaland',
    position: 'ST',
    rating: 91,
    country: 'Norway',
    countryFlag: '🇳🇴',
    club: 'Manchester City',
    age: 23,
    stats: { pace: 89, shooting: 91, passing: 65, dribbling: 80, defending: 45, physical: 88 },
    price: 170,
    height: 194
  },
  {
    id: '7',
    name: 'Thibaut Courtois',
    position: 'GK',
    rating: 90,
    country: 'Belgium',
    countryFlag: '🇧🇪',
    club: 'Real Madrid',
    age: 31,
    stats: { pace: 45, shooting: 11, passing: 75, dribbling: 41, defending: 35, physical: 89 },
    price: 60,
    height: 199
  },
  {
    id: '8',
    name: 'Joshua Kimmich',
    position: 'CDM',
    rating: 89,
    country: 'Germany',
    countryFlag: '🇩🇪',
    club: 'Bayern Munich',
    age: 29,
    stats: { pace: 70, shooting: 74, passing: 88, dribbling: 84, defending: 84, physical: 79 },
    price: 70,
    height: 177
  },
  {
    id: '9',
    name: 'Trent Alexander-Arnold',
    position: 'RB',
    rating: 87,
    country: 'England',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    club: 'Liverpool',
    age: 25,
    stats: { pace: 76, shooting: 66, passing: 89, dribbling: 76, defending: 76, physical: 71 },
    price: 65,
    height: 180
  },
  {
    id: '10',
    name: 'Luka Modrić',
    position: 'CM',
    rating: 87,
    country: 'Croatia',
    countryFlag: '🇭🇷',
    club: 'Real Madrid',
    age: 38,
    stats: { pace: 74, shooting: 76, passing: 89, dribbling: 90, defending: 72, physical: 65 },
    price: 35,
    height: 172
  },
  {
    id: '11',
    name: 'Marquinhos',
    position: 'CB',
    rating: 88,
    country: 'Brazil',
    countryFlag: '🇧🇷',
    club: 'PSG',
    age: 29,
    stats: { pace: 78, shooting: 48, passing: 75, dribbling: 77, defending: 88, physical: 82 },
    price: 55,
    height: 183
  },
  {
    id: '12',
    name: 'Bruno Fernandes',
    position: 'CAM',
    rating: 88,
    country: 'Portugal',
    countryFlag: '🇵🇹',
    club: 'Manchester United',
    age: 29,
    stats: { pace: 75, shooting: 85, passing: 89, dribbling: 84, defending: 68, physical: 77 },
    price: 65,
    height: 179
  },
  {
    id: '13',
    name: 'Alphonso Davies',
    position: 'LB',
    rating: 86,
    country: 'Canada',
    countryFlag: '🇨🇦',
    club: 'Bayern Munich',
    age: 23,
    stats: { pace: 96, shooting: 62, passing: 77, dribbling: 83, defending: 76, physical: 83 },
    price: 50,
    height: 183
  },
  {
    id: '14',
    name: 'Rodri',
    position: 'CDM',
    rating: 91,
    country: 'Spain',
    countryFlag: '🇪🇸',
    club: 'Manchester City',
    age: 27,
    stats: { pace: 62, shooting: 72, passing: 79, dribbling: 74, defending: 87, physical: 88 },
    price: 90,
    height: 191
  },
  {
    id: '15',
    name: 'Rúben Dias',
    position: 'CB',
    rating: 88,
    country: 'Portugal',
    countryFlag: '🇵🇹',
    club: 'Manchester City',
    age: 26,
    stats: { pace: 62, shooting: 40, passing: 67, dribbling: 67, defending: 88, physical: 84 },
    price: 65,
    height: 187
  },
  {
    id: '16',
    name: 'Marc-André ter Stegen',
    position: 'GK',
    rating: 89,
    country: 'Germany',
    countryFlag: '🇩🇪',
    club: 'Barcelona',
    age: 31,
    stats: { pace: 54, shooting: 10, passing: 88, dribbling: 50, defending: 40, physical: 87 },
    price: 58,
    height: 187
  },
  {
    id: '17',
    name: 'Casemiro',
    position: 'CDM',
    rating: 87,
    country: 'Brazil',
    countryFlag: '🇧🇷',
    club: 'Manchester United',
    age: 31,
    stats: { pace: 64, shooting: 73, passing: 75, dribbling: 72, defending: 87, physical: 90 },
    price: 50,
    height: 185
  },
  {
    id: '18',
    name: 'Vinícius Júnior',
    position: 'LW',
    rating: 90,
    country: 'Brazil',
    countryFlag: '🇧🇷',
    club: 'Real Madrid',
    age: 23,
    stats: { pace: 95, shooting: 83, passing: 79, dribbling: 92, defending: 29, physical: 61 },
    price: 140,
    height: 176
  },
  {
    id: '19',
    name: 'Antonio Rüdiger',
    position: 'CB',
    rating: 87,
    country: 'Germany',
    countryFlag: '🇩🇪',
    club: 'Real Madrid',
    age: 30,
    stats: { pace: 82, shooting: 55, passing: 73, dribbling: 70, defending: 86, physical: 86 },
    price: 55,
    height: 190
  },
  {
    id: '20',
    name: 'Federico Valverde',
    position: 'CM',
    rating: 88,
    country: 'Uruguay',
    countryFlag: '🇺🇾',
    club: 'Real Madrid',
    age: 25,
    stats: { pace: 84, shooting: 81, passing: 81, dribbling: 83, defending: 75, physical: 85 },
    price: 75,
    height: 182
  },
  {
    id: '21',
    name: 'Kyle Walker',
    position: 'RB',
    rating: 85,
    country: 'England',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    club: 'Manchester City',
    age: 33,
    stats: { pace: 90, shooting: 61, passing: 70, dribbling: 75, defending: 82, physical: 79 },
    price: 35,
    height: 183
  },
  {
    id: '22',
    name: 'Theo Hernández',
    position: 'LB',
    rating: 86,
    country: 'France',
    countryFlag: '🇫🇷',
    club: 'AC Milan',
    age: 26,
    stats: { pace: 93, shooting: 75, passing: 77, dribbling: 81, defending: 78, physical: 84 },
    price: 60,
    height: 184
  },
  {
    id: '23',
    name: 'Ederson',
    position: 'GK',
    rating: 89,
    country: 'Brazil',
    countryFlag: '🇧🇷',
    club: 'Manchester City',
    age: 30,
    stats: { pace: 54, shooting: 22, passing: 93, dribbling: 48, physical: 88, defending: 41 },
    price: 62,
    height: 188
  }
];

// Formation templates with position coordinates (in percentages)
export const formationTemplates: Record<Formation, SquadSlot[]> = {
  '4-3-3': [
    // GK
    { position: 'GK', player: null, x: 50, y: 90 },
    // Defense
    { position: 'LB', player: null, x: 20, y: 70 },
    { position: 'CB', player: null, x: 38, y: 75 },
    { position: 'CB', player: null, x: 62, y: 75 },
    { position: 'RB', player: null, x: 80, y: 70 },
    // Midfield
    { position: 'CDM', player: null, x: 50, y: 55 },
    { position: 'CM', player: null, x: 32, y: 45 },
    { position: 'CM', player: null, x: 68, y: 45 },
    // Attack
    { position: 'LW', player: null, x: 20, y: 20 },
    { position: 'ST', player: null, x: 50, y: 15 },
    { position: 'RW', player: null, x: 80, y: 20 }
  ],
  '4-4-2': [
    // GK
    { position: 'GK', player: null, x: 50, y: 90 },
    // Defense
    { position: 'LB', player: null, x: 20, y: 70 },
    { position: 'CB', player: null, x: 38, y: 75 },
    { position: 'CB', player: null, x: 62, y: 75 },
    { position: 'RB', player: null, x: 80, y: 70 },
    // Midfield
    { position: 'LM', player: null, x: 20, y: 45 },
    { position: 'CM', player: null, x: 40, y: 50 },
    { position: 'CM', player: null, x: 60, y: 50 },
    { position: 'RM', player: null, x: 80, y: 45 },
    // Attack
    { position: 'ST', player: null, x: 40, y: 18 },
    { position: 'ST', player: null, x: 60, y: 18 }
  ],
  '3-5-2': [
    // GK
    { position: 'GK', player: null, x: 50, y: 90 },
    // Defense
    { position: 'CB', player: null, x: 28, y: 72 },
    { position: 'CB', player: null, x: 50, y: 75 },
    { position: 'CB', player: null, x: 72, y: 72 },
    // Midfield
    { position: 'LM', player: null, x: 15, y: 50 },
    { position: 'CDM', player: null, x: 35, y: 55 },
    { position: 'CDM', player: null, x: 65, y: 55 },
    { position: 'RM', player: null, x: 85, y: 50 },
    { position: 'CAM', player: null, x: 50, y: 35 },
    // Attack
    { position: 'ST', player: null, x: 40, y: 15 },
    { position: 'ST', player: null, x: 60, y: 15 }
  ],
  '4-2-3-1': [
    // GK
    { position: 'GK', player: null, x: 50, y: 90 },
    // Defense
    { position: 'LB', player: null, x: 20, y: 70 },
    { position: 'CB', player: null, x: 38, y: 75 },
    { position: 'CB', player: null, x: 62, y: 75 },
    { position: 'RB', player: null, x: 80, y: 70 },
    // Midfield
    { position: 'CDM', player: null, x: 40, y: 55 },
    { position: 'CDM', player: null, x: 60, y: 55 },
    { position: 'LM', player: null, x: 22, y: 35 },
    { position: 'CAM', player: null, x: 50, y: 38 },
    { position: 'RM', player: null, x: 78, y: 35 },
    // Attack
    { position: 'ST', player: null, x: 50, y: 15 }
  ],
  '3-4-3': [
    // GK
    { position: 'GK', player: null, x: 50, y: 90 },
    // Defense
    { position: 'CB', player: null, x: 28, y: 72 },
    { position: 'CB', player: null, x: 50, y: 75 },
    { position: 'CB', player: null, x: 72, y: 72 },
    // Midfield
    { position: 'LM', player: null, x: 20, y: 50 },
    { position: 'CM', player: null, x: 40, y: 52 },
    { position: 'CM', player: null, x: 60, y: 52 },
    { position: 'RM', player: null, x: 80, y: 50 },
    // Attack
    { position: 'LW', player: null, x: 25, y: 20 },
    { position: 'ST', player: null, x: 50, y: 15 },
    { position: 'RW', player: null, x: 75, y: 20 }
  ]
};

// AI reasoning templates
export const getAIReasoning = (player: Player, position: string, formation: Formation): string => {
  const reasons = [
    `Selected for elite ${player.stats.pace > 85 ? 'pace' : player.stats.defending > 85 ? 'defensive' : 'technical'} ability and tactical versatility.`,
    `Fills the ${position} requirement under ${formation} formation.`,
    `Budget cost: €${player.price}M. Strong value for rating ${player.rating}.`,
    player.stats.passing > 85 ? 'Exceptional playmaking and set-piece delivery.' : '',
    player.stats.shooting > 85 ? 'Clinical finishing and goal-scoring threat.' : '',
    player.stats.physical > 85 ? 'Dominant aerial presence and physicality.' : '',
  ];
  return reasons.filter(Boolean).join(' ');
};

// Simulate AI building a squad
export const buildSquadWithAI = (
  formation: Formation,
  budget: number,
  prompt: string,
  constraints: { minGK: number; minDEF: number; minMID: number; minFWD: number }
): SquadSlot[] => {
  const template = [...formationTemplates[formation]];
  const availablePlayers = [...playerDatabase];

  // Simple AI simulation: fill positions with appropriate players
  return template.map(slot => {
    const matchingPlayers = availablePlayers.filter(p => {
      if (slot.position === 'GK') return p.position === 'GK';
      if (['LB', 'CB', 'RB'].includes(slot.position)) return ['LB', 'CB', 'RB'].includes(p.position);
      if (['LM', 'CM', 'CDM', 'CAM', 'RM'].includes(slot.position)) return ['LM', 'CM', 'CDM', 'CAM', 'RM'].includes(p.position);
      if (['LW', 'ST', 'RW'].includes(slot.position)) return ['LW', 'ST', 'RW'].includes(p.position);
      return false;
    });

    if (matchingPlayers.length > 0) {
      const selectedPlayer = matchingPlayers[Math.floor(Math.random() * matchingPlayers.length)];
      const index = availablePlayers.findIndex(p => p.id === selectedPlayer.id);
      if (index > -1) availablePlayers.splice(index, 1);
      return { ...slot, player: selectedPlayer };
    }

    return slot;
  });
};

// Build bench (7 slots) and reserves (5 slots) from remaining players
// Ensures max 3 GK total across entire 23-player squad
export const buildBenchAndReserves = (
  pitchSlots: SquadSlot[],
  _constraints: { minGK: number; minDEF: number; minMID: number; minFWD: number }
): { bench: SquadSlot[]; reserves: SquadSlot[] } => {
  const usedIds = new Set(
    pitchSlots.map(s => s.player?.id).filter((id): id is string => id !== undefined)
  );

  // Count GKs already on pitch
  const pitchGKCount = pitchSlots.filter(s => s.player?.position === 'GK').length;
  const maxExtraGK = Math.max(0, 3 - pitchGKCount);

  const remaining = playerDatabase.filter(p => !usedIds.has(p.id));

  // Sort remaining by rating desc
  const sorted = [...remaining].sort((a, b) => b.rating - a.rating);

  // Pick players respecting GK cap
  let extraGK = 0;
  const selected: Player[] = [];

  for (const player of sorted) {
    if (selected.length >= 12) break; // 7 bench + 5 reserves
    if (player.position === 'GK') {
      if (extraGK < maxExtraGK) {
        extraGK++;
        selected.push(player);
      }
    } else {
      selected.push(player);
    }
  }

  // If we still need more players (unlikely with 23-player DB), pad with whoever is left
  if (selected.length < 12) {
    for (const player of sorted) {
      if (selected.length >= 12) break;
      if (!selected.find(p => p.id === player.id)) {
        selected.push(player);
      }
    }
  }

  const bench: SquadSlot[] = selected.slice(0, 7).map(p => ({
    position: p.position,
    player: p,
    x: 0,
    y: 0
  }));

  const reserves: SquadSlot[] = selected.slice(7, 12).map(p => ({
    position: p.position,
    player: p,
    x: 0,
    y: 0
  }));

  return { bench, reserves };
};

// AI strategy reasoning generator
export const getSquadStrategyReasoning = (
  formation: Formation,
  buildUpStyle: string,
  defensiveApproach: string,
  budget: number,
  budgetEnabled: boolean
): string => {
  const paragraphs = [
    `The ${formation} formation was selected to balance defensive solidity with attacking width. This structure provides natural passing triangles through the midfield while allowing wing players to stretch the opposition's defensive line.`,
    buildUpStyle === 'Counter-Attack'
      ? `The counter-attacking build-up style heavily influenced midfield selections, prioritizing players with high pace and direct passing ability. Central midfielders were chosen for their ability to quickly transition from defense to attack, with an emphasis on vertical ball progression.`
      : buildUpStyle === 'Short Passing'
      ? `The short passing build-up style drove selections toward technically gifted midfielders with high passing and dribbling stats. Players comfortable in tight spaces and capable of maintaining possession under pressure were prioritized throughout the squad.`
      : `A balanced build-up approach was applied, selecting midfielders who can both retain possession and play incisive forward passes. This ensures tactical flexibility depending on the match situation.`,
    defensiveApproach === 'High Press'
      ? `The high press defensive approach influenced CB pairings toward faster, more agile defenders who can cover the space behind a high defensive line. Fullbacks with stamina and recovery pace were essential to support the pressing system.`
      : defensiveApproach === 'Deep Block'
      ? `The deep block defensive approach prioritized physically dominant center-backs with strong aerial ability and positioning. Defenders with high defensive stats were favored over pace, as the low block reduces the need for recovery runs.`
      : defensiveApproach === 'Aggressive'
      ? `An aggressive defensive approach required defenders comfortable with man-marking and physical duels. Center-backs with high physical and defending stats were paired to dominate aerial challenges and ground duels.`
      : `A balanced defensive approach was used, selecting defenders who can adapt between holding a line and pressing. This provides stability without committing to an extreme defensive posture.`,
    budgetEnabled
      ? `Budget constraints of €${budget}M required trade-offs: premium selections were reserved for key positions (goalkeeper, central midfield, striker), while value picks were used at fullback and wide positions. Overall squad depth was maintained without exceeding the cap.`
      : `With no budget constraint enforced, selections focused purely on player quality and tactical fit, resulting in the strongest possible squad composition.`,
    `Limitations: The current squad builder uses a simplified matching algorithm. In a production system, chemistry links between players from the same club or nation would further optimize the selection. Some positions may show sub-optimal fits due to the limited player pool.`
  ];
  return paragraphs.join('\n\n');
};

// AI confirmation message generator
export const getAIConfirmation = (
  formation: Formation,
  buildUpStyle: string,
  budget: number,
  budgetEnabled: boolean,
  playerCount: number,
  totalPrice: number
): string => {
  const budgetStr = budgetEnabled ? ` within €${budget}M budget` : '';
  return `Built a ${formation} ${buildUpStyle.toLowerCase()} squad. ${playerCount} players selected${budgetStr}. Total cost: €${totalPrice}M.`;
};

// Get replacement candidates for a position
export const getReplacementCandidates = (
  position: string,
  currentPlayerId: string,
  currentSquadIds: string[]
): ReplacementCandidate[] => {
  const positionGroup = position === 'GK' ? ['GK']
    : ['LB', 'CB', 'RB'].includes(position) ? ['LB', 'CB', 'RB']
    : ['LM', 'CM', 'CDM', 'CAM', 'RM'].includes(position) ? ['LM', 'CM', 'CDM', 'CAM', 'RM']
    : ['LW', 'ST', 'RW'];

  const candidates = playerDatabase
    .filter(p => positionGroup.includes(p.position) && p.id !== currentPlayerId && !currentSquadIds.includes(p.id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const reasons = [
    (p: Player) => p.stats.pace > 85 ? `Fastest ${position} available, strong crossing stats` : null,
    (p: Player) => p.stats.defending > 85 ? `Elite defensive ability, dominant in duels` : null,
    (p: Player) => p.stats.passing > 85 ? `Exceptional playmaking from ${position} position` : null,
    (p: Player) => p.stats.shooting > 85 ? `Clinical finishing and goal-scoring threat` : null,
    (p: Player) => p.stats.physical > 85 ? `Dominant physicality and aerial presence` : null,
    (p: Player) => `Strong overall ${position} option, rated ${p.rating}`,
  ];

  return candidates.map(p => {
    const reason = reasons.find(r => r(p) !== null)?.(p) || `Solid ${position} option under budget`;
    return { player: p, reason };
  });
};