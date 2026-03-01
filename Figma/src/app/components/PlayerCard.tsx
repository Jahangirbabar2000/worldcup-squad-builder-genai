import { Player } from '../types/squad';

interface PlayerCardProps {
  player: Player | null;
  position: string;
  onClick?: () => void;
  size?: 'small' | 'medium';
  isEmpty?: boolean;
  alternativeCount?: number;
}

export function PlayerCard({ player, position, onClick, size = 'medium', isEmpty = false, alternativeCount = 0 }: PlayerCardProps) {
  const isSmall = size === 'small';
  
  if (!player) {
    return (
      <div
        onClick={onClick}
        className={`
          relative cursor-pointer transition-all duration-200 hover:scale-105
          ${isSmall ? 'w-16 h-20' : 'w-20 h-28'}
        `}
      >
        {/* Empty slot with hexagon-like shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`
            relative border-2 border-dashed border-[#4ade80]/40 rounded-lg
            bg-[#1a1a2e]/60 backdrop-blur-sm
            hover:border-[#4ade80]/70 hover:bg-[#1a1a2e]/80
            transition-all duration-200
            ${isSmall ? 'w-14 h-16' : 'w-18 h-24'}
            flex flex-col items-center justify-center
          `}>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-lg border-2 border-[#4ade80]/30 animate-pulse" />
            <div className="text-[#4ade80]/60 text-2xl">+</div>
            <div className="text-[#4ade80]/60 text-xs mt-1">{position}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all duration-200 hover:scale-105
        ${isSmall ? 'w-16 h-20' : 'w-20 h-28'}
        ${player.locked ? 'ring-2 ring-[#4ade80]' : ''}
      `}
    >
      {/* Player card */}
      <div className={`
        relative rounded-lg overflow-hidden
        bg-gradient-to-br from-[#222244] to-[#1a1a2e]
        border border-[#4ade80]/30
        hover:border-[#4ade80]/60
        shadow-lg hover:shadow-[#4ade80]/20
        ${isSmall ? 'h-20' : 'h-28'}
        transition-all duration-200
      `}>
        {/* Rating badge */}
        <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-[#d4a843] flex items-center justify-center z-10">
          <span className="text-[#1a1a2e] font-bold text-xs">{player.rating}</span>
        </div>

        {/* Player info */}
        <div className="flex flex-col items-center justify-center h-full pt-6 px-1">
          <div className="text-white font-semibold text-[10px] text-center truncate w-full px-1 leading-tight">
            {player.name.split(' ').pop()}
          </div>
          <div className="text-xs mt-0.5">{player.countryFlag}</div>
          
          {/* Position tag */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#4ade80]/20 text-[#4ade80] text-[9px] px-1.5 py-0.5 rounded">
            {player.position}
          </div>
        </div>

        {/* Lock indicator */}
        {player.locked && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4ade80] flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-[#1a1a2e]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Alternatives badge */}
        {!player.locked && alternativeCount > 0 && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#4ade80] flex items-center justify-center shadow-md z-10">
            <span className="text-[#1a1a2e] font-bold text-[9px]">{alternativeCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
