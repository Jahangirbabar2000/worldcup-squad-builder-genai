import { SquadSlot, Formation } from '../types/squad';
import { PlayerCard } from './PlayerCard';

interface PitchViewProps {
  slots: SquadSlot[];
  formation: Formation;
  onPlayerClick: (index: number) => void;
  benchSlots: SquadSlot[];
  reserveSlots: SquadSlot[];
  onBenchClick?: (index: number) => void;
  onReserveClick?: (index: number) => void;
  onEmptySlotClick?: (source: 'pitch' | 'bench' | 'reserve', index: number, position: string) => void;
}

export function PitchView({ slots, formation, onPlayerClick, benchSlots, reserveSlots, onBenchClick, onReserveClick, onEmptySlotClick }: PitchViewProps) {
  return (
    <div className="space-y-4">
      {/* Pitch */}
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
        {/* Pitch background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a472a] to-[#0d2818]">
          {/* Field markings */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 300 400">
            {/* Center circle */}
            <circle cx="150" cy="200" r="40" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            <circle cx="150" cy="200" r="2" fill="#4ade80" />
            
            {/* Halfway line */}
            <line x1="0" y1="200" x2="300" y2="200" stroke="#4ade80" strokeWidth="1.5" />
            
            {/* Penalty areas */}
            <rect x="75" y="10" width="150" height="60" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="75" y="330" width="150" height="60" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            
            {/* Goal areas */}
            <rect x="110" y="10" width="80" height="30" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="110" y="360" width="80" height="30" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            
            {/* Penalty spots */}
            <circle cx="150" cy="40" r="2" fill="#4ade80" />
            <circle cx="150" cy="360" r="2" fill="#4ade80" />
            
            {/* Outer border */}
            <rect x="10" y="10" width="280" height="380" fill="none" stroke="#4ade80" strokeWidth="2" />
          </svg>

          {/* Player slots */}
          {slots.map((slot, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <PlayerCard
                player={slot.player}
                position={slot.position}
                alternativeCount={slot.alternatives?.length || 0}
                onClick={() => {
                  if (slot.player) {
                    onPlayerClick(index);
                  } else if (onEmptySlotClick) {
                    onEmptySlotClick('pitch', index, slot.position);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Bench</h3>
          <div className="flex gap-2 bg-[#222244] rounded-lg p-3 flex-wrap">
            {benchSlots.map((slot, i) => (
              <PlayerCard
                key={`bench-${i}`}
                player={slot.player}
                position={slot.position}
                size="small"
                onClick={
                  slot.player && onBenchClick
                    ? () => onBenchClick(i)
                    : onEmptySlotClick
                      ? () => onEmptySlotClick('bench', i, slot.position || 'SUB')
                      : undefined
                }
              />
            ))}
            {benchSlots.length < 7 && Array.from({ length: 7 - benchSlots.length }).map((_, i) => (
              <PlayerCard
                key={`bench-empty-${i}`}
                player={null}
                position="SUB"
                size="small"
                onClick={onEmptySlotClick ? () => onEmptySlotClick('bench', benchSlots.length + i, 'SUB') : undefined}
              />
            ))}
          </div>
        </div>

        {/* Reserves */}
        <div>
          <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Reserves</h3>
          <div className="flex gap-2 bg-[#222244] rounded-lg p-3 flex-wrap">
            {reserveSlots.map((slot, i) => (
              <PlayerCard
                key={`reserve-${i}`}
                player={slot.player}
                position={slot.position}
                size="small"
                onClick={
                  slot.player && onReserveClick
                    ? () => onReserveClick(i)
                    : onEmptySlotClick
                      ? () => onEmptySlotClick('reserve', i, slot.position || 'RES')
                      : undefined
                }
              />
            ))}
            {reserveSlots.length < 5 && Array.from({ length: 5 - reserveSlots.length }).map((_, i) => (
              <PlayerCard
                key={`reserve-empty-${i}`}
                player={null}
                position="RES"
                size="small"
                onClick={onEmptySlotClick ? () => onEmptySlotClick('reserve', reserveSlots.length + i, 'RES') : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
