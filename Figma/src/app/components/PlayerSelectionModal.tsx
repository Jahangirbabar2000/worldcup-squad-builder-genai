import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../types/squad';
import { searchPlayers } from '../api';
import { getStatColor } from '../utils/squadCalculations';
import { X, Search } from 'lucide-react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  position: string;
  onSelect: (player: Player) => void;
  onClose: () => void;
  alternatives?: Player[];
  existingPlayerIds?: string[];
}

export function PlayerSelectionModal({
  isOpen,
  position,
  onSelect,
  onClose,
  alternatives,
  existingPlayerIds = [],
}: PlayerSelectionModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'alternatives'>(
    alternatives && alternatives.length > 0 ? 'alternatives' : 'search'
  );
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPlayers = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const players = await searchPlayers(position, searchQuery, 30);
      const filtered = players.filter(p => !existingPlayerIds.includes(p.id));
      setResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [position, existingPlayerIds]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(alternatives && alternatives.length > 0 ? 'alternatives' : 'search');
    setQuery('');
    setResults([]);
  }, [isOpen, alternatives]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchPlayers(query), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query, activeTab, fetchPlayers]);

  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const displayPlayers = activeTab === 'alternatives'
    ? (alternatives || []).filter(p => !existingPlayerIds.includes(p.id))
    : results;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[80vh] bg-[#1a1a2e] border border-[#4ade80]/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">Select Player</h2>
            <span className="text-xs text-gray-400">Position: {position}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 mx-4 mt-3 bg-[#0f0f1e] rounded-lg">
          {alternatives && alternatives.length > 0 && (
            <button
              onClick={() => setActiveTab('alternatives')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'alternatives' ? 'bg-[#4ade80] text-[#1a1a2e]' : 'text-gray-400 hover:text-white'
              }`}
            >
              AI Picks ({alternatives.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search' ? 'bg-[#4ade80] text-[#1a1a2e]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Search Database
          </button>
        </div>

        {/* Search input (only for search tab) */}
        {activeTab === 'search' && (
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, club, or country..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#222244] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Player list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-0">
          {loading && activeTab === 'search' && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-400">Searching...</span>
            </div>
          )}

          {!loading && displayPlayers.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              {activeTab === 'search'
                ? query ? 'No players found.' : 'Type to search for players...'
                : 'No alternative picks available.'
              }
            </div>
          )}

          {displayPlayers.map((player, idx) => (
            <PlayerRow
              key={player.id + idx}
              player={player}
              isAIPick={activeTab === 'alternatives'}
              rank={activeTab === 'alternatives' ? idx + 1 : undefined}
              onSelect={() => onSelect(player)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


function PlayerRow({
  player,
  isAIPick,
  rank,
  onSelect,
}: {
  player: Player;
  isAIPick: boolean;
  rank?: number;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#222244] rounded-lg border border-gray-700/50 hover:border-[#4ade80]/40 transition-colors group">
      {/* Rank badge for AI picks */}
      {rank !== undefined && (
        <div className="w-6 h-6 rounded-full bg-[#4ade80]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[#4ade80] text-xs font-bold">{rank}</span>
        </div>
      )}

      {/* Rating */}
      <div className="w-10 h-10 rounded-full bg-[#d4a843] flex items-center justify-center flex-shrink-0">
        <span className="text-[#1a1a2e] font-bold text-sm">{player.rating}</span>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm truncate">{player.name}</span>
          <span className="text-xs">{player.countryFlag}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#4ade80]/20 text-[#4ade80] rounded">{player.position}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{player.club} &middot; {player.age}y</div>
        <div className="flex gap-3 mt-1">
          {[
            { l: 'PAC', v: player.stats.pace },
            { l: 'SHO', v: player.stats.shooting },
            { l: 'PAS', v: player.stats.passing },
            { l: 'DRI', v: player.stats.dribbling },
            { l: 'DEF', v: player.stats.defending },
            { l: 'PHY', v: player.stats.physical },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-0.5">
              <span className="text-[9px] text-gray-600">{s.l}</span>
              <span className={`text-[10px] font-bold ${getStatColor(s.v)}`}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      {player.price > 0 && (
        <div className="text-xs text-gray-400 flex-shrink-0">{'\u20AC'}{player.price}M</div>
      )}

      {/* Select button */}
      <button
        onClick={onSelect}
        className="px-3 py-1.5 bg-[#4ade80] text-[#1a1a2e] rounded-lg text-xs font-medium hover:bg-[#3bc96d] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        Select
      </button>
    </div>
  );
}
