import { getFactionInfo, getFactionComposition, type FactionType, type FactionSystem } from '../lib/factionSystem';

interface FactionPanelProps {
  factionSystem: FactionSystem;
  allCharacters: Record<string, any>;
  onJoinFaction?: (faction: FactionType) => void;
}

function FactionPanel({ factionSystem, allCharacters, onJoinFaction }: FactionPanelProps) {
  const composition = getFactionComposition(allCharacters);
  
  // Debug logging
  console.log('FactionPanel render:', { factionSystem, composition, characterCount: Object.keys(allCharacters).length });
  
  const factionTypes: FactionType[] = ['Rebel', 'Imperial', 'Loyalist', 'Independent'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-80">
      <h3 className="text-lg font-semibold text-center mb-4">Political Factions</h3>
      
      {/* Player Faction Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Your Faction:</span>
          <span className="text-gray-900">
            {factionSystem.playerFaction ? (
              <div className="flex items-center gap-1">
                <span style={{ color: getFactionInfo(factionSystem.playerFaction).color }}>
                  {getFactionInfo(factionSystem.playerFaction).badge}
                </span>
                {factionSystem.playerFaction}
              </div>
            ) : (
              'Independent'
            )}
          </span>
        </div>
      </div>

      {/* Faction Composition */}
      <div className="space-y-3">
        {factionTypes.map(faction => {
          const info = getFactionInfo(faction);
          const members = composition[faction] || [];
          
          return (
            <div key={faction} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: info.color }}>{info.badge}</span>
                  <span className="font-medium" style={{ color: info.color }}>
                    {faction}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {members.length > 0 && (
                <div className="text-xs text-gray-600">
                  {members.join(', ')}
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {info.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Membership Offers */}
      {factionSystem.membershipOffers.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Faction Invitations</h4>
          <div className="space-y-2">
            {factionSystem.membershipOffers.map(offer => {
              const info = getFactionInfo(offer.faction);
              return (
                <div key={offer.faction} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: info.color }}>{info.badge}</span>
                    <span className="text-sm">{offer.faction}</span>
                  </div>
                  {onJoinFaction && (
                    <button
                      onClick={() => onJoinFaction(offer.faction)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Faction Effects Info */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Faction Effects</h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <div>• +10 support with faction members</div>
          <div>• +20% trust bonus with faction members</div>
          <div>• -10 support with opposing factions</div>
          <div>• +20% suspicion with opposing factions</div>
        </div>
      </div>
    </div>
  );
}

export default FactionPanel;