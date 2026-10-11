export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          adults: number
          cancelled_at: string | null
          children: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          departure_id: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price_adult: number
          price_child: number | null
          reference: string
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          tour_id: string
          user_id: string
        }
        Insert: {
          adults: number
          cancelled_at?: string | null
          children?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_id: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price_adult: number
          price_child?: number | null
          reference: string
          status?: Database["public"]["Enums"]["booking_status"]
          total: number
          tour_id: string
          user_id: string
        }
        Update: {
          adults?: number
          cancelled_at?: string | null
          children?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_id?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price_adult?: number
          price_child?: number | null
          reference?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          tour_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "tour_departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          tour_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tour_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tour_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          id: string
        }
        Insert: {
          consent: boolean
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          newsletter: boolean
          phone: string | null
          preferred_language: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          newsletter?: boolean
          phone?: string | null
          preferred_language?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          newsletter?: boolean
          phone?: string | null
          preferred_language?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          author_name: string | null
          booking_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          tour_id: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          author_name?: string | null
          booking_id: string
          comment?: string
          created_at?: string
          id?: string
          rating: number
          tour_id: string
          user_id: string
        }
        Update: {
          approved?: boolean
          author_name?: string | null
          booking_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          tour_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_departures: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_demo: boolean
          reserved: number
          starts_at: string
          status: string
          tour_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          is_demo?: boolean
          reserved?: number
          starts_at: string
          status?: string
          tour_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          reserved?: number
          starts_at?: string
          status?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_departures_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          distance_km: number | null
          duration_minutes: number
          equipment: string | null
          excluded: string[]
          featured: boolean
          highlights: string[]
          id: string
          image_url: string | null
          included: string[]
          is_demo: boolean
          itinerary: Json
          languages: string[]
          lat: number | null
          lng: number | null
          max_group_size: number
          meeting_address: string
          meeting_point: string
          min_age: number | null
          price_adult: number
          price_child: number | null
          published: boolean
          safety_info: string | null
          short_description: string
          slug: string
          title: string
          type: Database["public"]["Enums"]["tour_type"]
        }
        Insert: {
          created_at?: string
          description?: string
          difficulty?: string
          distance_km?: number | null
          duration_minutes?: number
          equipment?: string | null
          excluded?: string[]
          featured?: boolean
          highlights?: string[]
          id?: string
          image_url?: string | null
          included?: string[]
          is_demo?: boolean
          itinerary?: Json
          languages?: string[]
          lat?: number | null
          lng?: number | null
          max_group_size?: number
          meeting_address?: string
          meeting_point?: string
          min_age?: number | null
          price_adult: number
          price_child?: number | null
          published?: boolean
          safety_info?: string | null
          short_description?: string
          slug: string
          title: string
          type: Database["public"]["Enums"]["tour_type"]
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          distance_km?: number | null
          duration_minutes?: number
          equipment?: string | null
          excluded?: string[]
          featured?: boolean
          highlights?: string[]
          id?: string
          image_url?: string | null
          included?: string[]
          is_demo?: boolean
          itinerary?: Json
          languages?: string[]
          lat?: number | null
          lng?: number | null
          max_group_size?: number
          meeting_address?: string
          meeting_point?: string
          min_age?: number | null
          price_adult?: number
          price_child?: number | null
          published?: boolean
          safety_info?: string | null
          short_description?: string
          slug?: string
          title?: string
          type?: Database["public"]["Enums"]["tour_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_booking_status: {
        Args: {
          _booking_id: string
          _status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
      cancel_booking: { Args: { _booking_id: string }; Returns: undefined }
      create_booking: {
        Args: {
          _adults: number
          _children: number
          _departure_id: string
          _notes?: string
        }
        Returns: {
          booking_id: string
          reference: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "rejected"
      payment_status:
        | "unpaid"
        | "pending_payment"
        | "paid"
        | "refunded"
        | "failed"
      tour_type: "walking" | "cycling"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "rejected",
      ],
      payment_status: [
        "unpaid",
        "pending_payment",
        "paid",
        "refunded",
        "failed",
      ],
      tour_type: ["walking", "cycling"],
    },
  },
} as const
