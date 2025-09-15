import type { Character } from '../types/character';
import FactionBadge from './FactionBadge';

interface CharacterInfoProps {
  character: Character;
  personality: string;
  canShowStats?: boolean;
  currentSeason?: number;
}

// Color-coding function for suspicion levels based on severity
function getSuspicionColor(suspicion: number): string {
  if (suspicion >= 0.8) return '#dc2626'; // red-600 - high danger
  if (suspicion >= 0.6) return '#ea580c'; // orange-600 - medium danger
  if (suspicion >= 0.4) return '#d97706'; // amber-600 - low danger
  return '#444'; // default gray
}

function CharacterInfo({ character, personality, canShowStats = false, currentSeason = 1 }: CharacterInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-80">
      {/* Character name */}
      <h2 className="text-2xl font-semibold text-center mb-2">
        {character.name}
      </h2>
      
      {/* Faction Badge */}
      <div className="flex justify-center mb-4">
        <FactionBadge character={character} size="medium" />
      </div>
      
      {/* Character details */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-gray-900">{character.type}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Support:</span>
          <span className="text-gray-900">{character.supportLevel}/100</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Personality:</span>
          <span className="text-gray-900">{personality}</span>
        </div>

        {/* Gift Status */}
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Gift Status:</span>
          <span className={`text-sm ${
            character.hasGivenGifts && character.giftCooldownUntil > currentSeason
              ? 'text-orange-600'
              : character.hasGivenGifts
              ? 'text-green-600'
              : 'text-gray-500'
          }`}>
            {character.hasGivenGifts && character.giftCooldownUntil > currentSeason
              ? `Cooldown (${character.giftCooldownUntil - currentSeason} seasons)`
              : character.hasGivenGifts
              ? 'Can give gifts'
              : 'No gifts given'
            }
            
          </span>
        </div>
      </div>

      {/* Character Stats Display - only shown when canShowStats is true */}
      {canShowStats && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '16px' }}>
          {/* Relationship Stats Section */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
              Relationship
            </h3>
            <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Trust:</span>
                <span>{Math.round(character.relationshipVectors.trustInPlayer * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Loyalty:</span>
                <span>{Math.round(character.relationshipVectors.loyaltyToPlayer * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Fear:</span>
                <span>{Math.round(character.relationshipVectors.fearOfPlayer * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Dependence:</span>
                <span>{Math.round(character.relationshipVectors.dependenceOnPlayer * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Personality Stats Section */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
              Personality
            </h3>
            <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Ambition:</span>
                <span>{Math.round(character.personalityVectors.ambition * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Empire Loyalty:</span>
                <span>{Math.round(character.personalityVectors.loyalty * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Influence:</span>
                <span>{Math.round(character.personalityVectors.influence * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Suspicion:</span>
                <span style={{ color: getSuspicionColor(character.suspicion) }}>
                  {Math.round(character.suspicion * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Threshold:</span>
                <span>{Math.round(character.suspicionThreshold * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterInfo;