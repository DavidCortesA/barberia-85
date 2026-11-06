
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "appointment_events": {
                  Row: {
                    "actor": string | null,"appointment_id": string,"created_at": string,"from_status": Database["public"]['Enums']["appointment_status"] | null,"id": string,"to_status": Database["public"]['Enums']["appointment_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor"?: string | null,"appointment_id": string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["appointment_status"] | null,"id"?: string,"to_status": Database["public"]['Enums']["appointment_status"]
                  }
                  Update: {
                    "actor"?: string | null,"appointment_id"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["appointment_status"] | null,"id"?: string,"to_status"?: Database["public"]['Enums']["appointment_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointment_events_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "admin_notes": string | null,"appointment_date": string,"barber_id": string | null,"created_at": string,"customer_id": string,"customer_notes": string | null,"duration_snapshot": number,"ends_at": string,"id": string,"price_snapshot": number,"resource_key": string | null,"service_id": string,"starts_at": string,"status": Database["public"]['Enums']["appointment_status"],"status_changed_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_notes"?: string | null,"appointment_date": string,"barber_id"?: string | null,"created_at"?: string,"customer_id": string,"customer_notes"?: string | null,"duration_snapshot": number,"ends_at": string,"id"?: string,"price_snapshot": number,"resource_key"?: never,"service_id": string,"starts_at": string,"status"?: Database["public"]['Enums']["appointment_status"],"status_changed_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string | null,"appointment_date"?: string,"barber_id"?: string | null,"created_at"?: string,"customer_id"?: string,"customer_notes"?: string | null,"duration_snapshot"?: number,"ends_at"?: string,"id"?: string,"price_snapshot"?: number,"resource_key"?: never,"service_id"?: string,"starts_at"?: string,"status"?: Database["public"]['Enums']["appointment_status"],"status_changed_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_barber_id_fkey"
      columns: ["barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"barber_hours": {
                  Row: {
                    "barber_id": string,"closing_time": string,"day_of_week": number,"id": string,"opening_time": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id": string,"closing_time": string,"day_of_week": number,"id"?: string,"opening_time": string
                  }
                  Update: {
                    "barber_id"?: string,"closing_time"?: string,"day_of_week"?: number,"id"?: string,"opening_time"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "barber_hours_barber_id_fkey"
      columns: ["barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["id"]
    }
                  ]
                },"barbers": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"image_url": string | null,"is_active": boolean,"name": string,"specialty": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name": string,"specialty"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name"?: string,"specialty"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blocked_slots": {
                  Row: {
                    "barber_id": string | null,"created_at": string,"end_datetime": string,"id": string,"reason": string | null,"start_datetime": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id"?: string | null,"created_at"?: string,"end_datetime": string,"id"?: string,"reason"?: string | null,"start_datetime": string
                  }
                  Update: {
                    "barber_id"?: string | null,"created_at"?: string,"end_datetime"?: string,"id"?: string,"reason"?: string | null,"start_datetime"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocked_slots_barber_id_fkey"
      columns: ["barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["id"]
    }
                  ]
                },"business_hours": {
                  Row: {
                    "closing_time": string | null,"day_of_week": number,"id": string,"is_closed": boolean,"opening_time": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "closing_time"?: string | null,"day_of_week": number,"id"?: string,"is_closed"?: boolean,"opening_time"?: string | null
                  }
                  Update: {
                    "closing_time"?: string | null,"day_of_week"?: number,"id"?: string,"is_closed"?: boolean,"opening_time"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"business_settings": {
                  Row: {
                    "address": string | null,"city": string | null,"facebook": string | null,"id": boolean,"instagram": string | null,"maps_url": string | null,"max_advance_days": number,"max_pending_per_phone": number,"min_notice_minutes": number,"name": string,"pending_hold_minutes": number,"phone": string | null,"slot_interval_minutes": number,"tiktok": string | null,"timezone": string,"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"facebook"?: string | null,"id"?: boolean,"instagram"?: string | null,"maps_url"?: string | null,"max_advance_days"?: number,"max_pending_per_phone"?: number,"min_notice_minutes"?: number,"name"?: string,"pending_hold_minutes"?: number,"phone"?: string | null,"slot_interval_minutes"?: number,"tiktok"?: string | null,"timezone"?: string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"facebook"?: string | null,"id"?: boolean,"instagram"?: string | null,"maps_url"?: string | null,"max_advance_days"?: number,"max_pending_per_phone"?: number,"min_notice_minutes"?: number,"name"?: string,"pending_hold_minutes"?: number,"phone"?: string | null,"slot_interval_minutes"?: number,"tiktok"?: string | null,"timezone"?: string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"phone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id"?: string,"phone": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"phone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"gallery_images": {
                  Row: {
                    "alt": string | null,"created_at": string,"id": string,"image_url": string,"is_active": boolean,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"image_url": string,"is_active"?: boolean,"sort_order"?: number
                  }
                  Update: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"image_url"?: string,"is_active"?: boolean,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"schedule_exceptions": {
                  Row: {
                    "closing_time": string | null,"created_at": string,"exception_date": string,"id": string,"is_closed": boolean,"note": string | null,"opening_time": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "closing_time"?: string | null,"created_at"?: string,"exception_date": string,"id"?: string,"is_closed"?: boolean,"note"?: string | null,"opening_time"?: string | null
                  }
                  Update: {
                    "closing_time"?: string | null,"created_at"?: string,"exception_date"?: string,"id"?: string,"is_closed"?: boolean,"note"?: string | null,"opening_time"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"description": string | null,"duration_minutes": number,"id": string,"image_url": string | null,"is_active": boolean,"name": string,"price": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"duration_minutes": number,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name": string,"price": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"duration_minutes"?: number,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name"?: string,"price"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_content": {
                  Row: {
                    "key": string,"updated_at": string,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value"?: string
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_replace_barber_hours":
{ Args: { "p_barber_id": string,"p_hours": Json }; Returns: undefined
                           },
"admin_replace_business_hours":
{ Args: { "p_hours": Json }; Returns: undefined
                           },
"create_appointment_request":
{ Args: { "p_barber_id"?: string,"p_full_name": string,"p_notes"?: string,"p_phone": string,"p_service_id": string,"p_starts_at": string }; Returns: {
              "admin_notes": string | null,
"appointment_date": string,
"barber_id": string | null,
"created_at": string,
"customer_id": string,
"customer_notes": string | null,
"duration_snapshot": number,
"ends_at": string,
"id": string,
"price_snapshot": number,
"resource_key": string | null,
"service_id": string,
"starts_at": string,
"status": Database["public"]['Enums']["appointment_status"],
"status_changed_at": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "appointments"
        isOneToOne: true
        isSetofReturn: false
      } },
"expire_stale_pending":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"get_busy_intervals":
{ Args: { "p_barber_id"?: string,"p_from": string,"p_to": string }; Returns: {
              "ends_at": string,"starts_at": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"slot_within_business_hours":
{ Args: { "p_end": string,"p_start": string }; Returns: boolean
                           }
          }
          Enums: {
            "appointment_status": "pending"|"confirmed"|"rejected"|"cancelled"|"completed"|"expired","user_role": "admin"|"staff"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "appointment_status": ["pending", "confirmed", "rejected", "cancelled", "completed", "expired"],"user_role": ["admin", "staff"]
          }
        }
} as const
