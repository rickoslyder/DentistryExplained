export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          clerk_id: string
          email: string
          user_type: 'patient' | 'professional'
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          user_type: 'patient' | 'professional'
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          user_type?: 'patient' | 'professional'
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      professional_verifications: {
        Row: {
          id: string
          user_id: string
          gdc_number: string | null
          verification_status: 'pending' | 'approved' | 'rejected'
          verification_documents: Json | null
          verified_at: string | null
          verified_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gdc_number?: string | null
          verification_status?: 'pending' | 'approved' | 'rejected'
          verification_documents?: Json | null
          verified_at?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gdc_number?: string | null
          verification_status?: 'pending' | 'approved' | 'rejected'
          verification_documents?: Json | null
          verified_at?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          page_context: Json | null
          created_at: string
          expires_at: string
          last_activity: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          page_context?: Json | null
          created_at?: string
          expires_at?: string
          last_activity?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          page_context?: Json | null
          created_at?: string
          expires_at?: string
          last_activity?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      practice_listings: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          location: unknown | null
          address: Json
          contact: Json
          services: string[] | null
          nhs_accepted: boolean
          private_accepted: boolean
          accessibility_features: string[] | null
          opening_hours: Json | null
          photos: string[] | null
          website_url: string | null
          claimed_by: string | null
          claim_status: 'unclaimed' | 'pending' | 'claimed'
          verification_documents: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          location?: unknown | null
          address: Json
          contact: Json
          services?: string[] | null
          nhs_accepted?: boolean
          private_accepted?: boolean
          accessibility_features?: string[] | null
          opening_hours?: Json | null
          photos?: string[] | null
          website_url?: string | null
          claimed_by?: string | null
          claim_status?: 'unclaimed' | 'pending' | 'claimed'
          verification_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          location?: unknown | null
          address?: Json
          contact?: Json
          services?: string[] | null
          nhs_accepted?: boolean
          private_accepted?: boolean
          accessibility_features?: string[] | null
          opening_hours?: Json | null
          photos?: string[] | null
          website_url?: string | null
          claimed_by?: string | null
          claim_status?: 'unclaimed' | 'pending' | 'claimed'
          verification_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      article_views: {
        Row: {
          id: string
          article_slug: string
          user_id: string | null
          session_id: string | null
          ip_address: unknown | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          article_slug: string
          user_id?: string | null
          session_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          article_slug?: string
          user_id?: string | null
          session_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          article_slug: string
          article_title: string | null
          article_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_slug: string
          article_title?: string | null
          article_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_slug?: string
          article_title?: string | null
          article_category?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json | null
          read: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
          expires_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          reading_level: 'basic' | 'advanced'
          email_notifications: boolean
          push_notifications: boolean
          marketing_emails: boolean
          theme: 'light' | 'dark' | 'system'
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reading_level?: 'basic' | 'advanced'
          email_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          theme?: 'light' | 'dark' | 'system'
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reading_level?: 'basic' | 'advanced'
          email_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          theme?: 'light' | 'dark' | 'system'
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      consent_forms: {
        Row: {
          id: string
          user_id: string
          template_type: string
          patient_name: string | null
          procedure_details: Json | null
          custom_fields: Json | null
          generated_pdf_url: string | null
          status: 'draft' | 'sent' | 'signed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_type: string
          patient_name?: string | null
          procedure_details?: Json | null
          custom_fields?: Json | null
          generated_pdf_url?: string | null
          status?: 'draft' | 'sent' | 'signed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_type?: string
          patient_name?: string | null
          procedure_details?: Json | null
          custom_fields?: Json | null
          generated_pdf_url?: string | null
          status?: 'draft' | 'sent' | 'signed'
          created_at?: string
          updated_at?: string
        }
      }
      content_analytics: {
        Row: {
          id: string
          article_slug: string
          date: string
          page_views: number
          unique_visitors: number
          avg_time_on_page: unknown | null
          bounce_rate: number | null
          search_impressions: number
          clicks_from_search: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_slug: string
          date?: string
          page_views?: number
          unique_visitors?: number
          avg_time_on_page?: unknown | null
          bounce_rate?: number | null
          search_impressions?: number
          clicks_from_search?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_slug?: string
          date?: string
          page_views?: number
          unique_visitors?: number
          avg_time_on_page?: unknown | null
          bounce_rate?: number | null
          search_impressions?: number
          clicks_from_search?: number
          created_at?: string
          updated_at?: string
        }
      }
      search_queries: {
        Row: {
          id: string
          user_id: string | null
          query: string
          results_count: number | null
          clicked_result: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          results_count?: number | null
          clicked_result?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          results_count?: number | null
          clicked_result?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_chat_sessions: {
        Args: {}
        Returns: undefined
      }
      get_trending_articles: {
        Args: {
          time_window?: string
          result_limit?: number
        }
        Returns: {
          article_slug: string
          view_count: number
          unique_visitors: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Convenience types for commonly used data structures
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type ProfessionalVerification = Database['public']['Tables']['professional_verifications']['Row']
export type ProfessionalVerificationInsert = Database['public']['Tables']['professional_verifications']['Insert']
export type ProfessionalVerificationUpdate = Database['public']['Tables']['professional_verifications']['Update']

export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update']

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

export type PracticeListing = Database['public']['Tables']['practice_listings']['Row']
export type PracticeListingInsert = Database['public']['Tables']['practice_listings']['Insert']
export type PracticeListingUpdate = Database['public']['Tables']['practice_listings']['Update']

export type ArticleView = Database['public']['Tables']['article_views']['Row']
export type ArticleViewInsert = Database['public']['Tables']['article_views']['Insert']

export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

export type ConsentForm = Database['public']['Tables']['consent_forms']['Row']
export type ConsentFormInsert = Database['public']['Tables']['consent_forms']['Insert']
export type ConsentFormUpdate = Database['public']['Tables']['consent_forms']['Update']

// Additional utility types
export interface PageContext {
  title: string
  category: string
  content: string
}

export interface PracticeAddress {
  street: string
  city: string
  postcode: string
  country: string
}

export interface PracticeContact {
  phone: string
  email: string
  website?: string
}

export interface OpeningHours {
  monday?: { open: string; close: string } | null
  tuesday?: { open: string; close: string } | null
  wednesday?: { open: string; close: string } | null
  thursday?: { open: string; close: string } | null
  friday?: { open: string; close: string } | null
  saturday?: { open: string; close: string } | null
  sunday?: { open: string; close: string } | null
}

export interface TrendingArticle {
  article_slug: string
  view_count: number
  unique_visitors: number
}