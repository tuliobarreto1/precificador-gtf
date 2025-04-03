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
      calculation_params: {
        Row: {
          created_at: string
          depreciation_base: number
          depreciation_mileage_multiplier: number
          depreciation_severity_multiplier: number
          extra_km_percentage: number
          id: string
          tracking_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          depreciation_base: number
          depreciation_mileage_multiplier: number
          depreciation_severity_multiplier: number
          extra_km_percentage: number
          id?: string
          tracking_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          depreciation_base?: number
          depreciation_mileage_multiplier?: number
          depreciation_severity_multiplier?: number
          extra_km_percentage?: number
          id?: string
          tracking_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          cep: number | null
          city: string | null
          complement: string | null
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          number: number | null
          phone: string | null
          responsible_person: string | null
          state: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: number | null
          city?: string | null
          complement?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          number?: number | null
          phone?: string | null
          responsible_person?: string | null
          state?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: number | null
          city?: string | null
          complement?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          number?: number | null
          phone?: string | null
          responsible_person?: string | null
          state?: string | null
          type?: string | null
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
      protection_benefits: {
        Row: {
          benefit_name: string
          created_at: string
          details: string | null
          id: string
          is_included: boolean
          plan_id: string
          updated_at: string
        }
        Insert: {
          benefit_name: string
          created_at?: string
          details?: string | null
          id?: string
          is_included?: boolean
          plan_id: string
          updated_at?: string
        }
        Update: {
          benefit_name?: string
          created_at?: string
          details?: string | null
          id?: string
          is_included?: boolean
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_benefits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_deductibles: {
        Row: {
          created_at: string
          id: string
          incident_type: string
          percentage: number
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_type: string
          percentage: number
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_type?: string
          percentage?: number
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_deductibles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          monthly_cost: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost?: number
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_cost?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_action_logs: {
        Row: {
          action_date: string | null
          action_type: string
          deleted_data: Json | null
          details: Json | null
          id: string
          quote_id: string | null
          quote_title: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          deleted_data?: Json | null
          details?: Json | null
          id?: string
          quote_id?: string | null
          quote_title?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          deleted_data?: Json | null
          details?: Json | null
          id?: string
          quote_id?: string | null
          quote_title?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_action_logs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
          depreciation_cost: number | null
          extra_km_rate: number | null
          has_tracking: boolean | null
          id: string
          maintenance_cost: number | null
          monthly_km: number | null
          monthly_value: number
          operation_severity: number | null
          protection_cost: number | null
          protection_plan_id: string | null
          quote_id: string | null
          total_cost: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          contract_months?: number | null
          created_at?: string
          depreciation_cost?: number | null
          extra_km_rate?: number | null
          has_tracking?: boolean | null
          id?: string
          maintenance_cost?: number | null
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          protection_cost?: number | null
          protection_plan_id?: string | null
          quote_id?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          contract_months?: number | null
          created_at?: string
          depreciation_cost?: number | null
          extra_km_rate?: number | null
          has_tracking?: boolean | null
          id?: string
          maintenance_cost?: number | null
          monthly_km?: number | null
          monthly_value?: number
          operation_severity?: number | null
          protection_cost?: number | null
          protection_plan_id?: string | null
          quote_id?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_vehicles_protection_plan_id_fkey"
            columns: ["protection_plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
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
          global_protection_plan_id: string | null
          has_tracking: boolean
          id: string
          monthly_km: number
          monthly_values: number | null
          operation_severity: number
          status: string
          status_flow: Database["public"]["Enums"]["quote_status"]
          title: string
          total_value: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          contract_months?: number
          created_at?: string
          created_by?: string | null
          global_protection_plan_id?: string | null
          has_tracking?: boolean
          id?: string
          monthly_km?: number
          monthly_values?: number | null
          operation_severity?: number
          status?: string
          status_flow?: Database["public"]["Enums"]["quote_status"]
          title: string
          total_value?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          contract_months?: number
          created_at?: string
          created_by?: string | null
          global_protection_plan_id?: string | null
          has_tracking?: boolean
          id?: string
          monthly_km?: number
          monthly_values?: number | null
          operation_severity?: number
          status?: string
          status_flow?: Database["public"]["Enums"]["quote_status"]
          title?: string
          total_value?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_global_protection_plan_id_fkey"
            columns: ["global_protection_plan_id"]
            isOneToOne: false
            referencedRelation: "protection_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
      vehicle_groups: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          revision_cost: number
          revision_km: number
          tire_cost: number
          tire_km: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          revision_cost: number
          revision_km: number
          tire_cost: number
          tire_km: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          revision_cost?: number
          revision_km?: number
          tire_cost?: number
          tire_km?: number
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
          fuel_type: string | null
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
          fuel_type?: string | null
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
          fuel_type?: string | null
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
      delete_client: {
        Args: {
          client_id: string
        }
        Returns: boolean
      }
      delete_quote: {
        Args: {
          quote_id: string
        }
        Returns: boolean
      }
      execute_sql: {
        Args: {
          sql_query: string
          params?: Json
        }
        Returns: Json
      }
      get_all_quote_action_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_date: string | null
          action_type: string
          deleted_data: Json | null
          details: Json | null
          id: string
          quote_id: string | null
          quote_title: string | null
          user_id: string | null
          user_name: string | null
        }[]
      }
      get_quote_action_logs_by_quote: {
        Args: {
          quote_id_param: string
        }
        Returns: {
          action_date: string | null
          action_type: string
          deleted_data: Json | null
          details: Json | null
          id: string
          quote_id: string | null
          quote_title: string | null
          user_id: string | null
          user_name: string | null
        }[]
      }
      insert_quote_action_log: {
        Args: {
          quote_id: string
          quote_title: string
          action_type: string
          user_id: string
          user_name: string
          action_date?: string
          details?: Json
          deleted_data?: Json
        }
        Returns: string
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
