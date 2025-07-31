export interface SessionGroup {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  title: string | null;
  context_summary: string | null;
  mood_at_start: number | null;
  mood_at_end: number | null;
  context_json: any;
}

export interface Session {
  id: string;
  user_id: string;
  session_group_id: string;
  created_at: string;
  input_type: string | null;
  input_transcript: string | null;
  gpt_response: string | null;
  audio_response_url: string | null;
  summary: string | null;
  mood_at_time: number | null;
  flagged: boolean;
  tags: string[] | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  raw_feedback: string;
  ai_summary: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  feedback_type: string;
  device_info: any | null;
  app_version: string | null;
  created_at: string;
  processed_at: string | null;
  status: 'pending' | 'processed' | 'resolved' | 'ignored';
  tags: string[] | null;
  metadata: any | null;
}

export interface Database {
  public: {
    Tables: {
      session_groups: {
        Row: SessionGroup;
        Insert: Omit<SessionGroup, 'id'>;
        Update: Partial<Omit<SessionGroup, 'id'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      feedback: {
        Row: Feedback;
        Insert: Omit<Feedback, 'id' | 'created_at'>;
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>>;
      };
    };
  };
} 