export interface ExtractedAlternative {
  letter: string;
  text: string;
  isCorrect: boolean;
  justification?: string;
}

export interface ExtractedQuestion {
  statement: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  source?: string;
  alternatives: ExtractedAlternative[];
}

export interface AIExtractionResult {
  questions: ExtractedQuestion[];
}