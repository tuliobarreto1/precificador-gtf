export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          contract_months: number | null
          created_at: string
          has_tracking: boolean | null
          id: string
          monthly_km: number | null
          monthly_value: number
          operation_severity: number | null
          quote_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          contract_months?: number | null
          created_at?: string
          has_tracking?: boolean | null
          id?: string
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          quote_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          contract_months?: number | null
          created_at?: string
          has_tracking?: boolean | null
          id?: string
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          quote_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["quote_status"]
          observation: string | null
          previous_status: Database["public"]["Enums"]["quote_status"] | null
          quote_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["quote_status"]
          observation?: string | null
          previous_status?: Database["public"]["Enums"]["quote_status"] | null
          quote_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["quote_status"]
          observation?: string | null
          previous_status?: Database["public"]["Enums"]["quote_status"] | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_vehicles: {
        Row: {
          contract_months: number | null
          created_at: string
          has_tracking: boolean | null
          id: string
          monthly_km: number | null
          monthly_value: number
          operation_severity: number | null
          quote_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          contract_months?: number | null
          created_at?: string
          has_tracking?: boolean | null
          id?: string
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          quote_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          contract_months?: number | null
          created_at?: string
          has_tracking?: boolean | null
          id?: string
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          quote_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_vehicles_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          contract_months: number
          created_at: string
          created_by: string | null
          has_tracking: boolean
          id: string
          monthly_km: number
          operation_severity: number
          status: string
          status_flow: Database["public"]["Enums"]["quote_status"]
          title: string
          total_value: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contract_months?: number
          created_at?: string
          created_by?: string | null
          has_tracking?: boolean
          id?: string
          monthly_km?: number
          operation_severity?: number
          status?: string
          status_flow?: Database["public"]["Enums"]["quote_status"]
          title: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contract_months?: number
          created_at?: string
          created_by?: string | null
          has_tracking?: boolean
          id?: string
          monthly_km?: number
          operation_severity?: number
          status?: string
          status_flow?: Database["public"]["Enums"]["quote_status"]
          title?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          password: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          password: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          created_by: string | null
          group_id: string | null
          id: string
          is_used: boolean
          model: string
          odometer: number | null
          plate_number: string | null
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          is_used?: boolean
          model: string
          odometer?: number | null
          plate_number?: string | null
          updated_at?: string
          value: number
          year: number
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          is_used?: boolean
          model?: string
          odometer?: number | null
          plate_number?: string | null
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_modify_quote: {
        Args: {
          _user_id: string
          _quote_id: string
          _user_role: string
        }
        Returns: boolean
      }
      is_valid_status_transition: {
        Args: {
          current_status: Database["public"]["Enums"]["quote_status"]
          new_status: Database["public"]["Enums"]["quote_status"]
        }
        Returns: boolean
      }
    }
    Enums: {
      quote_status:
        | "ORCAMENTO"
        | "PROPOSTA_GERADA"
        | "EM_VERIFICACAO"
        | "APROVADA"
        | "CONTRATO_GERADO"
        | "ASSINATURA_CLIENTE"
        | "ASSINATURA_DIRETORIA"
        | "AGENDAMENTO_ENTREGA"
        | "ENTREGA"
        | "CONCLUIDO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
