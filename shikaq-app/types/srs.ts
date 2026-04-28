export interface SrsQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  choices: { id: string; text: string }[];
  correct_choice_id: string | null;
  explanation: string | null;
  format: 'multiple_choice' | 'written' | 'cbt';
}

export interface ReviewState {
  question_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  due_at: string;
  last_review_at: string | null;
  reps: number;
  lapses: number;
}

export type AnswerRating = 'again' | 'good' | 'easy';

export interface DailyQueue {
  recall: SrsQuestion[];
  learn: SrsQuestion[];
}

export interface ReviewStats {
  dueToday: number;
  dueTomorrow: number;
  total: number;
}
