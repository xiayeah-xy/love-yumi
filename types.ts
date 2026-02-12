
export interface GameOption {
  id: string;
  text: string;
}

export interface GameScene {
  story: string;
  options: GameOption[];
  location: string;
  tone: 'gentleman' | 'cute';
  heartMessage?: string;
  imagePrompt: string;
}

export interface GameState {
  currentScene: GameScene | null;
  history: { action: string; story: string }[];
  loveScore: number;
  isLoading: boolean;
  error: string | null;
  currentImageUrl: string | null;
}
