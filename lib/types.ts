export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          trust_score: number;
          review_count: number;
          five_star_ratio: number;
          average_score_given: number;
          average_review_length: number;
          report_count: number;
          hidden_review_count: number;
          is_admin: boolean;
          is_synthetic: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          trust_score?: number;
          review_count?: number;
          five_star_ratio?: number;
          average_score_given?: number;
          average_review_length?: number;
          report_count?: number;
          hidden_review_count?: number;
          is_admin?: boolean;
          is_synthetic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          category: string;
          region: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          verification_status: string;
          ranking_limited: boolean;
          is_synthetic: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          region: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          verification_status?: string;
          ranking_limited?: boolean;
          is_synthetic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          store_id: string;
          user_id: string;
          taste_score: number;
          service_score: number;
          environment_score: number;
          review_score: number | null;
          review_text: string | null;
          photo_url: string | null;
          visit_type: string | null;
          price_satisfaction: string | null;
          is_high_score: boolean;
          high_score_reason: string | null;
          purchase_verified: boolean;
          quality_weight: number;
          user_weight: number;
          final_weight: number;
          is_hidden: boolean;
          excluded_from_score: boolean;
          is_synthetic: boolean;
          sentiment_label: string | null;
          sentiment_score: number | null;
          negative_signal_count: number;
          negative_signals: string[] | null;
          rating_text_mismatch: boolean;
          mismatch_reason: string | null;
          mismatch_confidence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          user_id: string;
          taste_score: number;
          service_score: number;
          environment_score: number;
          review_score?: number | null;
          review_text?: string | null;
          photo_url?: string | null;
          visit_type?: string | null;
          price_satisfaction?: string | null;
          is_high_score?: boolean;
          high_score_reason?: string | null;
          purchase_verified?: boolean;
          quality_weight?: number;
          user_weight?: number;
          final_weight?: number;
          is_hidden?: boolean;
          excluded_from_score?: boolean;
          is_synthetic?: boolean;
          sentiment_label?: string | null;
          sentiment_score?: number | null;
          negative_signal_count?: number;
          negative_signals?: string[] | null;
          rating_text_mismatch?: boolean;
          mismatch_reason?: string | null;
          mismatch_confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          target_type: string;
          target_id: string;
          reporter_id: string | null;
          reason: string;
          status: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          target_type: string;
          target_id: string;
          reporter_id?: string | null;
          reason: string;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      penalty_logs: {
        Row: {
          id: string;
          target_type: string;
          target_id: string;
          reason: string;
          severity: number;
          action: string;
          admin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: string;
          target_id: string;
          reason: string;
          severity?: number;
          action: string;
          admin_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["penalty_logs"]["Insert"]>;
        Relationships: [];
      };
      store_score_cache: {
        Row: {
          store_id: string;
          raw_score: number;
          bayesian_raw_score: number;
          adjusted_score: number;
          ranking_score: number;
          taste_score: number;
          service_score: number;
          environment_score: number;
          review_count: number;
          revisit_rate: number | null;
          unique_reviewer_count: number;
          returning_reviewer_count: number;
          trust_level: string;
          peer_average_raw_score: number;
          updated_at: string;
        };
        Insert: {
          store_id: string;
          raw_score?: number;
          bayesian_raw_score?: number;
          adjusted_score?: number;
          ranking_score?: number;
          taste_score?: number;
          service_score?: number;
          environment_score?: number;
          review_count?: number;
          revisit_rate?: number | null;
          unique_reviewer_count?: number;
          returning_reviewer_count?: number;
          trust_level?: string;
          peer_average_raw_score?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_score_cache"]["Insert"]>;
        Relationships: [];
      };
      scoring_settings: {
        Row: {
          id: boolean;
          include_synthetic_reviews: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          include_synthetic_reviews?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scoring_settings"]["Insert"]>;
        Relationships: [];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string | null;
          action_type: string;
          target_type: string;
          target_id: string;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action_type: string;
          target_type: string;
          target_id: string;
          memo?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_actions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_review_score: {
        Args: {
          taste: number;
          service: number;
          environment: number;
        };
        Returns: number;
      };
      calculate_quality_weight: {
        Args: {
          review_text: string | null;
          photo_url: string | null;
          is_high_score: boolean;
          high_score_reason: string | null;
        };
        Returns: number;
      };
      calculate_user_trust_weight: {
        Args: {
          input_user_id: string;
        };
        Returns: number;
      };
      recalculate_profile_stats: {
        Args: {
          input_user_id: string;
        };
        Returns: void;
      };
      get_peer_average: {
        Args: {
          input_region: string;
          input_category: string;
        };
        Returns: number;
      };
      include_synthetic_reviews_in_scoring: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      refresh_store_score_cache: {
        Args: {
          input_store_id: string;
        };
        Returns: void;
      };
      refresh_all_store_scores: {
        Args: Record<string, never>;
        Returns: void;
      };
      refresh_store_score_normalization: {
        Args: Record<string, never>;
        Returns: void;
      };
      set_synthetic_reviews_included: {
        Args: {
          include_reviews: boolean;
        };
        Returns: void;
      };
      set_synthetic_reviews_excluded: {
        Args: {
          exclude_reviews: boolean;
        };
        Returns: void;
      };
      create_report: {
        Args: {
          input_target_type: string;
          input_target_id: string;
          input_reporter_id: string;
          input_reason: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type StoreScoreCache = Database["public"]["Tables"]["store_score_cache"]["Row"];
export type ScoringSettings = Database["public"]["Tables"]["scoring_settings"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];

export type StoreWithScore = Store & {
  score: StoreScoreCache | null;
  rising?: StoreRisingSignal | null;
};

export type RankingReview = Pick<
  Review,
  | "store_id"
  | "taste_score"
  | "service_score"
  | "environment_score"
  | "created_at"
  | "purchase_verified"
>;

export type StoreWithScoreAndReviews = StoreWithScore & {
  ranking_reviews: RankingReview[];
};

export type StoreRisingSignal = {
  isRising: boolean;
  risingDelta: number;
  recentReviewCount: number;
};

export type ProfileSummary = Pick<Profile, "id" | "nickname" | "trust_score" | "review_count"> & {
  is_synthetic?: boolean;
};

export type ReviewWithProfile = Review & {
  profile: ProfileSummary | null;
};

export type ReportWithReporter = Report & {
  reporter: ProfileSummary | null;
};
