export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: 'IT' | 'business';
  icon_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  certification_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  youtube_url: string | null;
  content_body: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

export interface QuizChoice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  lesson_id: string;
  question_text: string;
  choices: QuizChoice[];
  correct_choice_id: string;
  explanation: string | null;
  order_index: number;
  created_at: string;
}

export type QuizFormat = 'multiple_choice' | 'written' | 'cbt';

export interface QuizResult {
  id: string;
  user_id: string;
  question_id: string;
  selected_choice_id: string;
  is_correct: boolean;
  answered_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
}
