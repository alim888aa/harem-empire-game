import { useEffect, useState } from 'react';

interface CharacterResponseProps {
  response: string;
}

function CharacterResponse({ response }: CharacterResponseProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (response) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [response]);

  if (!response || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 animate-fade-in">
        <div className="flex justify-between items-start">
          <p className="text-gray-800 italic text-sm leading-relaxed pr-2">
            {response}
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close response"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterResponse;