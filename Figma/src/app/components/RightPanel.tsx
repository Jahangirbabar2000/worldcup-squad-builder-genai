import { useState, useEffect } from 'react';
import { Player, PlayerStats, Formation, BuildUpStyle, DefensiveApproach } from '../types/squad';
import { getStatColor, calculateAverageStats, calculateAverageHeight } from '../utils/squadCalculations';
import { getReplacementCandidates as getReplacementCandidatesAPI, ReplacementCandidate } from '../api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

interface RightPanelProps {
  // Squad overview data
  formation: Formation;
  buildUpStyle: BuildUpStyle;
  defensiveApproach: DefensiveApproach;
  squadRating: number;
  averageStats: PlayerStats;
  totalPrice: number;
  playerCount: number;
  maxPlayers: number;
  budgetUsed: number;
  budgetCap: number;
  budgetEnabled: boolean;
  allPlayers: (Player | null)[];
  // Player details
  selectedPlayer: Player | null;
  selectedPosition: string;
  onToggleLock: () => void;
  onReplacePlayer: (newPlayer: Player) => void;
  // Active tab control
  activeTab: 'overview' | 'details';
  onTabChange: (tab: 'overview' | 'details') => void;
  // AI-generated strategy reasoning from the backend
  strategyReasoning?: string;
}

export function RightPanel({
  formation,
  buildUpStyle,
  defensiveApproach,
  squadRating,
  averageStats,
  totalPrice,
  playerCount,
  budgetCap,
  budgetEnabled,
  allPlayers,
  selectedPlayer,
  selectedPosition,
  onToggleLock,
  onReplacePlayer,
  activeTab,
  onTabChange,
  strategyReasoning,
}: RightPanelProps) {
  const [showReplacement, setShowReplacement] = useState(false);
  const [replacementCandidates, setReplacementCandidates] = useState<ReplacementCandidate[]>([]);

  // Reset replacement view when player changes
  useEffect(() => {
    setShowReplacement(false);
  }, [selectedPlayer?.id]);

  const handleReplace = async () => {
    if (!selectedPlayer) return;
    const squadIds = allPlayers.filter((p): p is Player => p !== null).map(p => p.id);
    try {
      const candidates = await getReplacementCandidatesAPI(selectedPosition, selectedPlayer.id, squadIds);
      setReplacementCandidates(candidates);
      setShowReplacement(true);
    } catch (err) {
      console.error('Failed to get replacements:', err);
    }
  };

  const handleSelectReplacement = (candidate: Player) => {
    onReplacePlayer(candidate);
    setShowReplacement(false);
  };

  return (
    <div className="bg-[#222244] rounded-lg border border-[#4ade80]/20 sticky top-20">
      {/* Segmented toggle */}
      <div className="flex p-1.5 m-3 mb-0 bg-[#1a1a2e] rounded-lg">
        <button
          onClick={() => onTabChange('overview')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-[#4ade80] text-[#1a1a2e]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Squad Overview
        </button>
        <button
          onClick={() => onTabChange('details')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'details' ? 'bg-[#4ade80] text-[#1a1a2e]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Player Details
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'overview' ? (
          <SquadOverview
            formation={formation}
            buildUpStyle={buildUpStyle}
            defensiveApproach={defensiveApproach}
            squadRating={squadRating}
            averageStats={averageStats}
            totalPrice={totalPrice}
            playerCount={playerCount}
            budgetCap={budgetCap}
            budgetEnabled={budgetEnabled}
            allPlayers={allPlayers}
            strategyReasoning={strategyReasoning}
          />
        ) : showReplacement && selectedPlayer ? (
          <ReplacementView
            position={selectedPosition}
            candidates={replacementCandidates}
            onSelect={handleSelectReplacement}
            onBack={() => setShowReplacement(false)}
          />
        ) : (
          <PlayerDetailsView
            player={selectedPlayer}
            position={selectedPosition}
            formation={formation}
            onReplace={handleReplace}
            onToggleLock={onToggleLock}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Squad Overview Tab ─── */
function SquadOverview({
  formation,
  buildUpStyle,
  defensiveApproach,
  squadRating,
  averageStats,
  totalPrice,
  playerCount,
  budgetCap,
  budgetEnabled,
  allPlayers,
  strategyReasoning,
}: {
  formation: Formation;
  buildUpStyle: BuildUpStyle;
  defensiveApproach: DefensiveApproach;
  squadRating: number;
  averageStats: PlayerStats;
  totalPrice: number;
  playerCount: number;
  budgetCap: number;
  budgetEnabled: boolean;
  allPlayers: (Player | null)[];
  strategyReasoning?: string;
}) {
  const [expandedAverages, setExpandedAverages] = useState(false);

  const starRating = Math.min(5, Math.floor(squadRating / 20));
  const partialStar = (squadRating % 20) / 20;

  // Group players by position
  const validPlayers = allPlayers.filter((p): p is Player => p !== null);
  const defPlayers = validPlayers.filter(p => ['LB', 'CB', 'RB'].includes(p.position));
  const midPlayers = validPlayers.filter(p => ['LM', 'CM', 'CDM', 'CAM', 'RM'].includes(p.position));
  const atkPlayers = validPlayers.filter(p => ['LW', 'ST', 'RW'].includes(p.position));

  const reasoning = strategyReasoning || 'Build a squad to see AI strategy reasoning here.';

  return (
    <div className="space-y-5">
      {/* Formation */}
      <div>
        <div className="text-xs text-gray-400 mb-1">FORMATION</div>
        <div className="text-3xl font-bold text-white">{formation}</div>
      </div>

      {/* Squad Rating */}
      <div>
        <div className="text-xs text-gray-400 mb-2">SQUAD RATING</div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-[#d4a843]">{squadRating.toFixed(1)}</div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
              if (i < starRating) {
                return (
                  <svg key={i} className="w-4 h-4 text-[#d4a843]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              } else if (i === starRating && partialStar > 0) {
                return (
                  <div key={i} className="relative w-4 h-4">
                    <svg className="absolute w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg className="absolute w-4 h-4 text-[#d4a843] overflow-hidden" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: `inset(0 ${(1 - partialStar) * 100}% 0 0)` }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                );
              } else {
                return (
                  <svg key={i} className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Six-stat averages */}
      <div>
        <div className="text-xs text-gray-400 mb-3">SQUAD AVERAGES</div>
        <div className="grid grid-cols-6 gap-2">
          {[
            { label: 'PAC', value: averageStats.pace },
            { label: 'SHO', value: averageStats.shooting },
            { label: 'PAS', value: averageStats.passing },
            { label: 'DRI', value: averageStats.dribbling },
            { label: 'DEF', value: averageStats.defending },
            { label: 'PHY', value: averageStats.physical }
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className={`text-lg font-bold ${getStatColor(stat.value)}`}>{stat.value}</div>
              <div className="text-[10px] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable full averages */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setExpandedAverages(!expandedAverages)}
          className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>Full Squad Averages</span>
          {expandedAverages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expandedAverages && (
          <div className="mt-3 space-y-4">
            {[
              { label: 'Defense', players: defPlayers },
              { label: 'Midfield', players: midPlayers },
              { label: 'Attack', players: atkPlayers },
              { label: 'All', players: validPlayers },
            ].map(group => {
              const stats = calculateAverageStats(group.players);
              const avgHeight = calculateAverageHeight(group.players);
              return (
                <div key={group.label}>
                  <div className="text-xs text-gray-500 mb-1">{group.label} ({group.players.length})</div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {[
                      { l: 'PAC', v: stats.pace },
                      { l: 'SHO', v: stats.shooting },
                      { l: 'PAS', v: stats.passing },
                      { l: 'DRI', v: stats.dribbling },
                      { l: 'DEF', v: stats.defending },
                      { l: 'PHY', v: stats.physical },
                      { l: 'HGT', v: avgHeight },
                    ].map(s => (
                      <div key={s.l} className="flex flex-col items-center">
                        <div className={`text-xs font-bold ${s.l === 'HGT' ? 'text-gray-300' : getStatColor(s.v)}`}>
                          {s.l === 'HGT' ? `${s.v}` : s.v}
                        </div>
                        <div className="text-[8px] text-gray-600">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chemistry */}
      <div>
        <div className="text-xs text-gray-400 mb-2">TOTAL CHEMISTRY</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#4ade80]" style={{ width: '0%' }} />
          </div>
          <span className="text-sm text-white">0/33</span>
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="text-xs text-gray-400 mb-2">TOTAL SQUAD COST</div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#d4a843]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
          <span className="text-xl font-bold text-white">€{totalPrice}M</span>
        </div>
      </div>

      {/* AI Strategy Reasoning */}
      {playerCount > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">AI Strategy Reasoning</h3>
          <div className="border-l-2 border-[#4ade80] pl-3 py-1">
            {reasoning.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-xs text-gray-400 leading-relaxed mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Player Details Tab ─── */
function PlayerDetailsView({
  player,
  position,
  formation,
  onReplace,
  onToggleLock,
}: {
  player: Player | null;
  position: string;
  formation: Formation;
  onReplace: () => void;
  onToggleLock: () => void;
}) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Select a player on the pitch to view details.
      </div>
    );
  }

  const radarData = [
    { stat: 'PAC', value: player.stats.pace, fullMark: 100 },
    { stat: 'SHO', value: player.stats.shooting, fullMark: 100 },
    { stat: 'PAS', value: player.stats.passing, fullMark: 100 },
    { stat: 'DRI', value: player.stats.dribbling, fullMark: 100 },
    { stat: 'DEF', value: player.stats.defending, fullMark: 100 },
    { stat: 'PHY', value: player.stats.physical, fullMark: 100 }
  ];

  const reasoning = player.justification || `Selected for the ${position} role in ${formation} formation. Rating: ${player.rating}.`;

  return (
    <div className="space-y-5">
      {/* Player header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{player.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <span>{player.countryFlag}</span>
            <span>{player.age} years</span>
            <span>•</span>
            <span>{player.club}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#d4a843] flex items-center justify-center">
          <span className="text-[#1a1a2e] font-bold text-lg">{player.rating}</span>
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Player Statistics</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#4ade80" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="stat" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Radar name="Stats" dataKey="value" stroke="#4ade80" fill="#4ade80" fillOpacity={0.3} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Reasoning */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">AI Reasoning</h3>
        <div className="border-l-2 border-[#4ade80] pl-3 py-1">
          <p className="text-sm text-gray-300 leading-relaxed">{reasoning}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onReplace}
          className="w-full px-4 py-2 border border-[#4ade80] text-[#4ade80] rounded-lg hover:bg-[#4ade80]/10 transition-colors text-sm font-medium"
        >
          Replace Player
        </button>
        <div className="flex items-center justify-between bg-[#1a1a2e] rounded-lg p-3">
          <span className="text-sm text-gray-300">Lock Player</span>
          <button
            onClick={onToggleLock}
            className={`relative w-11 h-6 rounded-full transition-colors ${player.locked ? 'bg-[#4ade80]' : 'bg-gray-600'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${player.locked ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Replacement View ─── */
function ReplacementView({
  position,
  candidates,
  onSelect,
  onBack,
}: {
  position: string;
  candidates: ReplacementCandidate[];
  onSelect: (player: Player) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to player</span>
        </button>
        <h3 className="text-lg font-bold text-white">Recommended Replacements</h3>
        <span className="text-xs text-gray-400">for {position}</span>
      </div>

      {/* Candidate list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
        {candidates.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">No replacement candidates available.</div>
        ) : (
          candidates.map(({ player, reason }) => (
            <div key={player.id} className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700 hover:border-[#4ade80]/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{player.name}</span>
                    <span className="text-xs">{player.countryFlag}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{player.club}</div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{reason}</p>
                  {/* Compact stat row */}
                  <div className="flex gap-3 mt-2">
                    {[
                      { l: 'PAC', v: player.stats.pace },
                      { l: 'DEF', v: player.stats.defending },
                      { l: 'PHY', v: player.stats.physical },
                    ].map(s => (
                      <div key={s.l} className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-600">{s.l}</span>
                        <span className={`text-xs font-bold ${getStatColor(s.v)}`}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 ml-3">
                  <div className="w-9 h-9 rounded-full bg-[#d4a843] flex items-center justify-center">
                    <span className="text-[#1a1a2e] font-bold text-xs">{player.rating}</span>
                  </div>
                  <button
                    onClick={() => onSelect(player)}
                    className="px-3 py-1 bg-[#4ade80] text-[#1a1a2e] rounded text-xs font-medium hover:bg-[#3bc96d] transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
