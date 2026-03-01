import { PipelineStage } from '../types/squad';

interface ProgressIndicatorProps {
  currentStage: PipelineStage;
  isRunning: boolean;
}

const stages: PipelineStage[] = ['Retrieving', 'Filtering', 'Constraining', 'Justifying'];

export function ProgressIndicator({ currentStage, isRunning }: ProgressIndicatorProps) {
  const getCurrentIndex = () => {
    if (currentStage === 'Complete') return stages.length;
    return stages.indexOf(currentStage);
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="space-y-3">
      <div className="flex items-center w-full">
        {stages.map((stage, index) => {
          const isActive = index === currentIndex && isRunning;
          const isComplete = index < currentIndex || currentStage === 'Complete';

          return (
            <div key={stage} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                    transition-all duration-300
                    ${isActive ? 'bg-[#4ade80] text-[#1a1a2e] animate-pulse' : ''}
                    ${isComplete ? 'bg-[#4ade80] text-[#1a1a2e]' : ''}
                    ${!isActive && !isComplete ? 'bg-gray-700 text-gray-400' : ''}
                  `}
                >
                  {isComplete && !isActive ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-xs mt-2 text-center text-gray-300 truncate w-full px-0.5">
                  {stage}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex-1 min-w-[8px] h-0.5 mx-1 relative top-[-12px] self-start mt-4">
                  <div
                    className={`
                      w-full h-full min-h-[2px] transition-all duration-300 rounded
                      ${index < currentIndex ? 'bg-[#4ade80]' : 'bg-gray-700'}
                    `}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
