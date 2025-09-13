import type { Character } from '../types/character';

interface ActionButtonsProps {
  character: Character;
  gifts: number;
  onAction: (action: string, messageType?: string) => void;
}

function ActionButtons({ character, gifts, onAction }: ActionButtonsProps) {

  const handleGiveSimpleGift = () => {
      onAction('gift');
  };

  const handleGiveGiftWithMessage = (messageType: string) => {
      onAction('message', messageType);
  };

  const handleSpitInFace = () => {
    onAction('spit');
  };

  return (
    <div className="flex flex-col space-y-3">
      <button
        onClick={handleGiveSimpleGift}
        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`}
      >
        Give Simple Gift
      </button>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Give Gift with Message:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleGiveGiftWithMessage('ambitious')}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-500`}
          >
            Ambitious
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('loyal')}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`}
          >
            Loyal
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('cautious')}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500`}
          >
            Cautious
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('neutral')}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500`}
          >
            Neutral
          </button>
        </div>
      </div>
      
      <button
        onClick={handleSpitInFace}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Spit in Face
      </button>
    </div>
  );
}

export default ActionButtons;