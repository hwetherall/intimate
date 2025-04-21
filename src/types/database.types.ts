export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          full_name: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
        }
      }
      couples: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_couples: {
        Row: {
          user_id: string
          couple_id: string
        }
        Insert: {
          user_id: string
          couple_id: string
        }
        Update: {
          user_id?: string
          couple_id?: string
        }
      }
      preferences: {
        Row: {
          id: string
          user_id: string
          preference_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          couple_id: string
          recommendation_data: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          recommendation_data: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          recommendation_data?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_feedback: {
        Row: {
          id: string
          session_id: string
          user_id: string
          feedback_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          feedback_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          feedback_data?: Json
          created_at?: string
        }
      }
      question_history: {
        Row: {
          id: string
          user_id: string
          question: string
          response: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          response: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          response?: Json
          created_at?: string
        }
      }
    }
  }
}