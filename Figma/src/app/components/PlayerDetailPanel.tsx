import { Player } from '../types/squad';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getAIReasoning } from '../data/mockData';

interface PlayerDetailPanelProps {
  player: Player | null;
  position: string;
  formation: string;
  onReplace?: () => void;
  onToggleLock?: () => void;
}

export function PlayerDetailPanel({ player, position, formation, onReplace, onToggleLock }: PlayerDetailPanelProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Click a player to view details
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

  const reasoning = getAIReasoning(player, position, formation as any);

  return (
    <div className="space-y-6">
      {/* Player header */}
      <div className="space-y-2">
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
      </div>

      {/* Radar chart */}
      <div className="bg-[#222244] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Player Statistics</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#4ade80" strokeOpacity={0.2} />
            <PolarAngleAxis 
              dataKey="stat" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="#4ade80"
              fill="#4ade80"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Reasoning */}
      <div className="bg-[#222244] rounded-lg p-4">
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
        
        <div className="flex items-center justify-between bg-[#222244] rounded-lg p-3">
          <span className="text-sm text-gray-300">Lock Player</span>
          <button
            onClick={onToggleLock}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${player.locked ? 'bg-[#4ade80]' : 'bg-gray-600'}
            `}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                ${player.locked ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
