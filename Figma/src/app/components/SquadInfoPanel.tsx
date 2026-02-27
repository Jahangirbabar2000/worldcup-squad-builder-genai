import { PlayerStats } from '../types/squad';
import { getStatColor } from '../utils/squadCalculations';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SquadInfoPanelProps {
  formation: string;
  squadRating: number;
  averageStats: PlayerStats;
  totalPrice: number;
  playerCount: number;
  maxPlayers: number;
  budgetUsed: number;
  budgetCap: number;
  positionStatus: {
    gk: boolean;
    def: boolean;
    mid: boolean;
    fwd: boolean;
  };
}

export function SquadInfoPanel({
  formation,
  squadRating,
  averageStats,
  totalPrice,
  playerCount,
  maxPlayers,
  budgetUsed,
  budgetCap,
  positionStatus
}: SquadInfoPanelProps) {
  const [expandedAverages, setExpandedAverages] = useState(false);

  // Calculate star rating (out of 5)
  const starRating = Math.min(5, Math.floor(squadRating / 20));
  const partialStar = (squadRating % 20) / 20;

  return (
    <div className="bg-[#222244] rounded-lg p-5 space-y-6 border border-[#4ade80]/20">
      {/* Formation */}
      <div>
        <div className="text-xs text-gray-400 mb-1">FORMATION</div>
        <div className="text-2xl font-bold text-white">{formation}</div>
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
                    <svg 
                      className="absolute w-4 h-4 text-[#d4a843] overflow-hidden" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      style={{ clipPath: `inset(0 ${(1 - partialStar) * 100}% 0 0)` }}
                    >
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

      {/* Six-stat row */}
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
              <div className={`text-lg font-bold ${getStatColor(stat.value)}`}>
                {stat.value}
              </div>
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
          <div className="mt-3 space-y-2 text-xs">
            <div className="text-gray-400">Coming soon: Detailed position-specific averages</div>
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

      {/* Players count */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>PLAYERS SELECTED</span>
          <span className="text-white font-medium">{playerCount}/{maxPlayers}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4ade80]" 
            style={{ width: `${(playerCount / maxPlayers) * 100}%` }} 
          />
        </div>
      </div>

      {/* Budget used */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>BUDGET USED</span>
          <span className="text-white font-medium">€{budgetUsed}M / €{budgetCap}M</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${budgetUsed > budgetCap ? 'bg-red-500' : 'bg-[#4ade80]'}`}
            style={{ width: `${Math.min((budgetUsed / budgetCap) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* Position quotas */}
      <div>
        <div className="text-xs text-gray-400 mb-3">POSITION QUOTAS</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${positionStatus.gk ? 'bg-[#4ade80]' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">GK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${positionStatus.def ? 'bg-[#4ade80]' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">DEF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${positionStatus.mid ? 'bg-[#4ade80]' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">MID</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${positionStatus.fwd ? 'bg-[#4ade80]' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">FWD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
