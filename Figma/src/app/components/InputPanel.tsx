import { useState, useRef, useEffect } from 'react';
import { Formation, BuildUpStyle, DefensiveApproach, ChatMessage } from '../types/squad';
import { Send } from 'lucide-react';

interface InputPanelProps {
  prompt: string;
  formation: Formation;
  buildUpStyle: BuildUpStyle;
  defensiveApproach: DefensiveApproach;
  budget: number;
  budgetEnabled: boolean;
  constraints: {
    minGK: number;
    maxGK: number;
    minDEF: number;
    minMID: number;
    minFWD: number;
  };
  chatMessages: ChatMessage[];
  hasBuiltOnce: boolean;
  onPromptChange: (value: string) => void;
  onFormationChange: (value: Formation) => void;
  onBuildUpStyleChange: (value: BuildUpStyle) => void;
  onDefensiveApproachChange: (value: DefensiveApproach) => void;
  onBudgetChange: (value: number) => void;
  onBudgetEnabledChange: (value: boolean) => void;
  onConstraintChange: (field: keyof InputPanelProps['constraints'], value: number) => void;
  onBuildSquad: () => void;
  onSendMessage: (message: string) => void;
  isBuilding: boolean;
}

export function InputPanel({
  prompt,
  formation,
  buildUpStyle,
  defensiveApproach,
  budget,
  budgetEnabled,
  constraints,
  chatMessages,
  hasBuiltOnce,
  onPromptChange,
  onFormationChange,
  onBuildUpStyleChange,
  onDefensiveApproachChange,
  onBudgetChange,
  onBudgetEnabledChange,
  onConstraintChange,
  onBuildSquad,
  onSendMessage,
  isBuilding
}: InputPanelProps) {
  const [constraintsOpen, setConstraintsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const selectClass = "w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white focus:border-[#4ade80] focus:outline-none focus:ring-1 focus:ring-[#4ade80] cursor-pointer text-sm";

  return (
    <div className="bg-[#222244] rounded-lg p-5 space-y-5 border border-[#4ade80]/20">
      {/* Formation selector */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Formation</label>
        <select
          value={formation}
          onChange={(e) => onFormationChange(e.target.value as Formation)}
          className={selectClass}
        >
          <option value="4-3-3">4-3-3</option>
          <option value="4-4-2">4-4-2</option>
          <option value="3-5-2">3-5-2</option>
          <option value="4-2-3-1">4-2-3-1</option>
          <option value="3-4-3">3-4-3</option>
        </select>
      </div>

      {/* Build-Up Style & Defensive Approach row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Build-Up Style</label>
          <select
            value={buildUpStyle}
            onChange={(e) => onBuildUpStyleChange(e.target.value as BuildUpStyle)}
            className={selectClass}
          >
            <option value="Balanced">Balanced</option>
            <option value="Counter-Attack">Counter-Attack</option>
            <option value="Short Passing">Short Passing</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Defensive</label>
          <select
            value={defensiveApproach}
            onChange={(e) => onDefensiveApproachChange(e.target.value as DefensiveApproach)}
            className={selectClass}
          >
            <option value="Balanced">Balanced</option>
            <option value="Deep Block">Deep Block</option>
            <option value="High Press">High Press</option>
            <option value="Aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      {/* Budget slider with optional toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Budget Cap (€M)</label>
            {/* Optional toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Optional</span>
              <button
                onClick={() => onBudgetEnabledChange(!budgetEnabled)}
                className={`relative w-8 h-4 rounded-full transition-colors ${budgetEnabled ? 'bg-[#4ade80]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${budgetEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${budgetEnabled ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'bg-gray-700 text-gray-500'}`}>
            €{budget}M
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={budget}
          onChange={(e) => onBudgetChange(parseInt(e.target.value))}
          disabled={!budgetEnabled}
          className={`w-full h-2 rounded-lg appearance-none slider ${!budgetEnabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            background: budgetEnabled
              ? `linear-gradient(to right, #4ade80 0%, #4ade80 ${(budget / 500) * 100}%, #374151 ${(budget / 500) * 100}%, #374151 100%)`
              : '#374151'
          }}
        />
      </div>

      {/* Position constraints collapsible */}
      <div>
        <button
          onClick={() => setConstraintsOpen(!constraintsOpen)}
          className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>Position Constraints</span>
          <svg className={`w-4 h-4 transition-transform ${constraintsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {constraintsOpen && (() => {
          const total = constraints.minGK + constraints.minDEF + constraints.minMID + constraints.minFWD;
          const remaining = 23 - total;
          return (
          <div className="mt-3 space-y-3">
            <div className={`text-xs bg-[#1a1a2e] rounded-lg px-3 py-2 flex justify-between ${total !== 23 ? 'text-red-400' : 'text-gray-500'}`}>
              <span>Squad: {total}/23 players</span>
              {remaining !== 0 && <span>{remaining > 0 ? `${remaining} slots unassigned` : `${-remaining} over limit`}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* GK - fixed at 3 */}
              <div className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">GK</span>
                <span className="text-white text-sm w-6 text-center">3</span>
              </div>
              {/* DEF, MID, FWD - adjustable */}
              {[
                { label: 'DEF', field: 'minDEF' as const, min: 4, max: 12 },
                { label: 'MID', field: 'minMID' as const, min: 3, max: 10 },
                { label: 'FWD', field: 'minFWD' as const, min: 2, max: 8 }
              ].map(({ label, field, min, max }) => (
                <div key={field} className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onConstraintChange(field, Math.max(min, constraints[field] - 1))}
                      disabled={constraints[field] <= min}
                      className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="text-white text-sm w-6 text-center">{constraints[field]}</span>
                    <button
                      onClick={() => onConstraintChange(field, Math.min(max, constraints[field] + 1))}
                      disabled={constraints[field] >= max || total >= 23}
                      className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </div>

      {/* Rebuild button (always visible when config changes possible) */}
      {hasBuiltOnce && (
        <button
          onClick={onBuildSquad}
          disabled={isBuilding}
          className="w-full py-2 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10 disabled:border-gray-700 disabled:text-gray-500 rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium"
        >
          {isBuilding ? 'Rebuilding...' : 'Rebuild Squad'}
        </button>
      )}

      {/* Divider */}
      <div className="border-t border-gray-700" />

      {/* Prompt / Conversation area */}
      {!hasBuiltOnce ? (
        <>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Describe Your Squad Strategy</label>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Fast counter-attacking team with strong set-piece takers"
              className="w-full h-28 px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#4ade80] focus:outline-none focus:ring-1 focus:ring-[#4ade80] resize-none text-sm"
            />
          </div>
          <button
            onClick={onBuildSquad}
            disabled={isBuilding}
            className="w-full py-3 bg-[#4ade80] hover:bg-[#3bc96d] disabled:bg-gray-700 text-[#1a1a2e] font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isBuilding ? 'Building...' : 'Build Squad'}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <label className="text-sm text-gray-400 block">Refine Your Squad</label>

          {/* Chat thread */}
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1a1a2e] text-gray-300'
                      : 'bg-[#1a1a2e] border-l-2 border-[#4ade80] text-gray-300'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Add instructions, e.g. 'swap the left back for someone faster'..."
              className="flex-1 px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#4ade80] focus:outline-none focus:ring-1 focus:ring-[#4ade80] text-sm"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim() || isBuilding}
              className="px-3 py-2 bg-[#4ade80] hover:bg-[#3bc96d] disabled:bg-gray-700 text-[#1a1a2e] rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
