import { useState } from 'react';
import { Formation, BuildUpStyle, DefensiveApproach, SquadSlot, PipelineStage, SquadConstraints, ChatMessage, Player } from './types/squad';
import { formationTemplates } from './data/mockData';
import { calculateAverageStats, calculateSquadRating, calculateTotalPrice, countPositions } from './utils/squadCalculations';
import { InputPanel } from './components/InputPanel';
import { PitchView } from './components/PitchView';
import { RightPanel } from './components/RightPanel';
import { ProgressIndicator } from './components/ProgressIndicator';
import { PlayerSelectionModal } from './components/PlayerSelectionModal';
import { Info } from 'lucide-react';
import { buildSquad as buildSquadAPI, sendChat as sendChatAPI } from './api';

type SelectedLocation = { source: 'pitch' | 'bench' | 'reserve'; index: number } | null;
type SelectionModalState = { source: 'pitch' | 'bench' | 'reserve'; index: number; position: string } | null;

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [buildUpStyle, setBuildUpStyle] = useState<BuildUpStyle>('Balanced');
  const [defensiveApproach, setDefensiveApproach] = useState<DefensiveApproach>('Balanced');
  const [budget, setBudget] = useState(300);
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [constraints, setConstraints] = useState<SquadConstraints>({
    minGK: 3,
    minDEF: 4,
    minMID: 4,
    minFWD: 2
  });

  const [squadSlots, setSquadSlots] = useState<SquadSlot[]>(formationTemplates[formation]);
  const [benchSlots, setBenchSlots] = useState<SquadSlot[]>([]);
  const [reserveSlots, setReserveSlots] = useState<SquadSlot[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(null);

  const [isBuilding, setIsBuilding] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('Complete');
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [hasBuiltOnce, setHasBuiltOnce] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Right panel tab
  const [rightPanelTab, setRightPanelTab] = useState<'overview' | 'details'>('overview');

  // Strategy reasoning from backend
  const [strategyReasoning, setStrategyReasoning] = useState<string>('');

  // Player selection modal
  const [selectionModal, setSelectionModal] = useState<SelectionModalState>(null);

  // Derive all players from pitch + bench + reserves
  const allPlayers: (Player | null)[] = [
    ...squadSlots.map(s => s.player),
    ...benchSlots.map(s => s.player),
    ...reserveSlots.map(s => s.player),
  ];

  // Calculate squad stats from ALL 23 players
  const averageStats = calculateAverageStats(allPlayers);
  const squadRating = calculateSquadRating(allPlayers);
  const totalPrice = calculateTotalPrice(allPlayers);
  const playerCount = allPlayers.filter(p => p !== null).length;
  const positionCounts = countPositions(allPlayers);

  const positionStatus = {
    gk: positionCounts.gk >= constraints.minGK,
    def: positionCounts.def >= constraints.minDEF,
    mid: positionCounts.mid >= constraints.minMID,
    fwd: positionCounts.fwd >= constraints.minFWD
  };

  // Derive selected player from location
  const getSelectedSlot = (): SquadSlot | null => {
    if (!selectedLocation) return null;
    const { source, index } = selectedLocation;
    if (source === 'pitch') return squadSlots[index] ?? null;
    if (source === 'bench') return benchSlots[index] ?? null;
    if (source === 'reserve') return reserveSlots[index] ?? null;
    return null;
  };
  const selectedSlot = getSelectedSlot();
  const selectedPlayer = selectedSlot?.player ?? null;
  const selectedPosition = selectedSlot?.position ?? '';

  // Handle formation change
  const handleFormationChange = (newFormation: Formation) => {
    setFormation(newFormation);
    setSquadSlots(formationTemplates[newFormation]);
    setBenchSlots([]);
    setReserveSlots([]);
    setSelectedLocation(null);
  };

  // Handle constraint change
  const handleConstraintChange = (field: keyof SquadConstraints, value: number) => {
    setConstraints(prev => ({ ...prev, [field]: value }));
  };

  // Build squad with AI
  const handleBuildSquad = async () => {
    setIsBuilding(true);
    setSelectedLocation(null);
    const startTime = Date.now();

    const animateProgress = async () => {
      const stages: PipelineStage[] = ['Retrieving', 'Filtering', 'Constraining', 'Justifying'];
      for (const stage of stages) {
        setPipelineStage(stage);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    };

    const apiCall = buildSquadAPI({
      prompt: prompt || 'Build me a balanced World Cup squad',
      formation,
      buildUpStyle,
      defensiveApproach,
      budget,
      budgetEnabled,
      constraints,
    });

    try {
      const [result] = await Promise.all([apiCall, animateProgress()]);

      setSquadSlots(result.pitchSlots);
      setBenchSlots(result.benchSlots);
      setReserveSlots(result.reserveSlots);
      setStrategyReasoning(result.strategyReasoning);

      setPipelineStage('Complete');
      const endTime = Date.now();
      setLastRunTime((endTime - startTime) / 1000);
      setIsBuilding(false);

      if (!hasBuiltOnce) {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          text: prompt || 'Build me a squad',
        };
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'ai',
          text: result.aiMessage,
        };
        setChatMessages([userMsg, aiMsg]);
      }

      setHasBuiltOnce(true);
    } catch (err) {
      console.error('Build squad error:', err);
      setPipelineStage('Complete');
      setIsBuilding(false);
    }
  };

  // Handle send chat message
  const handleSendMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: message,
    };
    setChatMessages(prev => [...prev, userMsg]);

    setIsBuilding(true);
    setSelectedLocation(null);

    const animateProgress = async () => {
      const stages: PipelineStage[] = ['Retrieving', 'Filtering', 'Constraining', 'Justifying'];
      for (const stage of stages) {
        setPipelineStage(stage);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    };

    const apiCall = sendChatAPI(
      message, formation, buildUpStyle, defensiveApproach,
      budget, budgetEnabled, constraints,
    );

    try {
      const [result] = await Promise.all([apiCall, animateProgress()]);

      setSquadSlots(result.pitchSlots);
      setBenchSlots(result.benchSlots);
      setReserveSlots(result.reserveSlots);
      setStrategyReasoning(result.strategyReasoning);

      setPipelineStage('Complete');
      setIsBuilding(false);

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'ai',
        text: result.aiMessage,
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setPipelineStage('Complete');
      setIsBuilding(false);

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'ai',
        text: 'Sorry, something went wrong. Please try again.',
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  // Handle player click from pitch
  const handlePlayerClick = (index: number) => {
    const slot = squadSlots[index];
    if (slot?.player) {
      if (slot.alternatives && slot.alternatives.length > 0) {
        setSelectionModal({ source: 'pitch', index, position: slot.position });
      } else {
        setSelectedLocation({ source: 'pitch', index });
        setRightPanelTab('details');
      }
    }
  };

  // Handle player click from bench
  const handleBenchClick = (index: number) => {
    if (benchSlots[index]?.player) {
      setSelectedLocation({ source: 'bench', index });
      setRightPanelTab('details');
    }
  };

  // Handle player click from reserves
  const handleReserveClick = (index: number) => {
    if (reserveSlots[index]?.player) {
      setSelectedLocation({ source: 'reserve', index });
      setRightPanelTab('details');
    }
  };

  // Handle empty slot click (opens selection modal)
  const handleEmptySlotClick = (source: 'pitch' | 'bench' | 'reserve', index: number, position: string) => {
    setSelectionModal({ source, index, position });
  };

  // Handle player selected from modal
  const handleModalSelect = (player: Player) => {
    if (!selectionModal) return;
    const { source, index } = selectionModal;

    if (source === 'pitch') {
      setSquadSlots(prev => prev.map((slot, i) =>
        i === index ? { ...slot, player, alternatives: undefined } : slot
      ));
    } else if (source === 'bench') {
      setBenchSlots(prev => {
        if (index < prev.length) {
          return prev.map((slot, i) => i === index ? { ...slot, player } : slot);
        }
        return [...prev, { position: player.position, player, x: 0, y: 0 }];
      });
    } else if (source === 'reserve') {
      setReserveSlots(prev => {
        if (index < prev.length) {
          return prev.map((slot, i) => i === index ? { ...slot, player } : slot);
        }
        return [...prev, { position: player.position, player, x: 0, y: 0 }];
      });
    }

    setSelectionModal(null);
  };

  // Toggle lock on selected player
  const handleToggleLock = () => {
    if (!selectedLocation) return;
    const { source, index } = selectedLocation;
    const updateSlot = (slots: SquadSlot[], i: number) =>
      slots.map((slot, si) => {
        if (si === i && slot.player) {
          return { ...slot, player: { ...slot.player, locked: !slot.player.locked } };
        }
        return slot;
      });

    if (source === 'pitch') setSquadSlots(prev => updateSlot(prev, index));
    if (source === 'bench') setBenchSlots(prev => updateSlot(prev, index));
    if (source === 'reserve') setReserveSlots(prev => updateSlot(prev, index));
  };

  // Handle replace player
  const handleReplacePlayer = (newPlayer: Player) => {
    if (!selectedLocation) return;
    const { source, index } = selectedLocation;
    const replaceInSlot = (slots: SquadSlot[], i: number) =>
      slots.map((slot, si) => (si === i ? { ...slot, player: newPlayer } : slot));

    if (source === 'pitch') setSquadSlots(prev => replaceInSlot(prev, index));
    if (source === 'bench') setBenchSlots(prev => replaceInSlot(prev, index));
    if (source === 'reserve') setReserveSlots(prev => replaceInSlot(prev, index));
  };

  // Export squad
  const handleExport = () => {
    const exportData = {
      formation,
      squad: squadSlots.map(s => s.player ? { name: s.player.name, position: s.position } : null),
      bench: benchSlots.map(s => s.player ? { name: s.player.name, position: s.position } : null),
      reserves: reserveSlots.map(s => s.player ? { name: s.player.name, position: s.position } : null),
      rating: squadRating,
      totalPrice
    };
    console.log('Export:', exportData);
    alert('Squad exported to console!');
  };

  // Reset squad
  const handleReset = () => {
    setSquadSlots(formationTemplates[formation]);
    setBenchSlots([]);
    setReserveSlots([]);
    setSelectedLocation(null);
    setSelectionModal(null);
    setPrompt('');
    setHasBuiltOnce(false);
    setChatMessages([]);
    setRightPanelTab('overview');
    setStrategyReasoning('');
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#0f0f1e] border-b border-[#4ade80]/20 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <h1 className="font-bold text-lg">Squad Architect</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-1.5 bg-[#4ade80] text-[#1a1a2e] rounded-full text-sm font-medium hover:bg-[#3bc96d] transition-colors"
            >
              Export Squad
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 border border-gray-600 text-gray-300 rounded-full text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
            >
              Reset
            </button>
            <button className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-500 transition-colors">
              <Info className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-[#4ade80] to-transparent" />
      </header>

      {/* Main content */}
      <div className="pt-12 pb-12">
        <div className="max-w-[1440px] mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left column - Input */}
            <div className="col-span-3 space-y-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white">Squad Architect</h2>
                <p className="text-sm text-gray-400 mt-1">AI-Powered World Cup Squad Builder</p>
              </div>

              <InputPanel
                prompt={prompt}
                formation={formation}
                buildUpStyle={buildUpStyle}
                defensiveApproach={defensiveApproach}
                budget={budget}
                budgetEnabled={budgetEnabled}
                constraints={constraints}
                chatMessages={chatMessages}
                hasBuiltOnce={hasBuiltOnce}
                onPromptChange={setPrompt}
                onFormationChange={handleFormationChange}
                onBuildUpStyleChange={setBuildUpStyle}
                onDefensiveApproachChange={setDefensiveApproach}
                onBudgetChange={setBudget}
                onBudgetEnabledChange={setBudgetEnabled}
                onConstraintChange={handleConstraintChange}
                onBuildSquad={handleBuildSquad}
                onSendMessage={handleSendMessage}
                isBuilding={isBuilding}
              />

              {/* Progress indicator */}
              {(isBuilding || (pipelineStage !== 'Complete' && lastRunTime === null)) && (
                <div className="bg-[#222244] rounded-lg p-4 border border-[#4ade80]/20">
                  <ProgressIndicator currentStage={pipelineStage} isRunning={isBuilding} />
                </div>
              )}
            </div>

            {/* Center column - Pitch view */}
            <div className="col-span-5">
              <PitchView
                slots={squadSlots}
                formation={formation}
                onPlayerClick={handlePlayerClick}
                benchSlots={benchSlots}
                reserveSlots={reserveSlots}
                onBenchClick={handleBenchClick}
                onReserveClick={handleReserveClick}
                onEmptySlotClick={handleEmptySlotClick}
              />
            </div>

            {/* Right column - Context panel */}
            <div className="col-span-4">
              <RightPanel
                formation={formation}
                buildUpStyle={buildUpStyle}
                defensiveApproach={defensiveApproach}
                squadRating={squadRating}
                averageStats={averageStats}
                totalPrice={totalPrice}
                playerCount={playerCount}
                maxPlayers={23}
                budgetUsed={totalPrice}
                budgetCap={budget}
                budgetEnabled={budgetEnabled}
                allPlayers={allPlayers}
                selectedPlayer={selectedPlayer}
                selectedPosition={selectedPosition}
                onToggleLock={handleToggleLock}
                onReplacePlayer={handleReplacePlayer}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
                strategyReasoning={strategyReasoning}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#0f0f1e] border-t border-[#4ade80]/20">
        <div className="h-full px-6 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-6">
            <span>Total players: {playerCount}/23</span>
            <div className="flex items-center gap-2">
              <span>Budget:</span>
              <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${!budgetEnabled ? 'bg-gray-500' : totalPrice > budget ? 'bg-red-500' : 'bg-[#4ade80]'}`}
                  style={{ width: budgetEnabled ? `${Math.min((totalPrice / budget) * 100, 100)}%` : '0%' }}
                />
              </div>
              <span>{budgetEnabled ? `€${totalPrice}M / €${budget}M` : 'Off'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Position quotas:</span>
              <div className="flex gap-3">
                <span className={positionStatus.gk ? 'text-[#4ade80]' : 'text-red-500'}>
                  GK: {positionCounts.gk}/{constraints.minGK}
                </span>
                <span className={positionStatus.def ? 'text-[#4ade80]' : 'text-red-500'}>
                  DEF: {positionCounts.def}/{constraints.minDEF}
                </span>
                <span className={positionStatus.mid ? 'text-[#4ade80]' : 'text-red-500'}>
                  MID: {positionCounts.mid}/{constraints.minMID}
                </span>
                <span className={positionStatus.fwd ? 'text-[#4ade80]' : 'text-red-500'}>
                  FWD: {positionCounts.fwd}/{constraints.minFWD}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span>Average squad rating: {squadRating.toFixed(1)}</span>
            {lastRunTime !== null && <span>Last run: {lastRunTime.toFixed(1)}s</span>}
          </div>
        </div>
      </div>

      {/* Player selection modal */}
      <PlayerSelectionModal
        isOpen={selectionModal !== null}
        position={selectionModal?.position || ''}
        alternatives={
          selectionModal?.source === 'pitch'
            ? squadSlots[selectionModal.index]?.alternatives
            : undefined
        }
        existingPlayerIds={allPlayers.filter((p): p is Player => p !== null).map(p => p.id)}
        onSelect={handleModalSelect}
        onClose={() => setSelectionModal(null)}
      />
    </div>
  );
}
