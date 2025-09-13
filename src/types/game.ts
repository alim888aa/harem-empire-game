
export interface PlayerStats {
  influence: number;
  ambition: number;
  loyalty: number;
  fear: number;
  charisma: number;
}

export type PlayerType = 'prince' | 'minister' | 'concubine';

export interface GameState {
  // Player info
  playerType: PlayerType | null;
  rank: string;
  
  // Game progression
  season: number;
  systemSupport: number; // Total system support points for promotion
  gifts: number;
  
  // UI state
  currentCharacterIndex: number;
  showStatsModal: boolean;
  
  // Game status
  isGameStarted: boolean;
  characterSupport: Record<string, number>;

}