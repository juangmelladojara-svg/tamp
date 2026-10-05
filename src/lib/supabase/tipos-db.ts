// Generado desde el esquema de Supabase (proyecto "tamp", smbypngcqeqcffbhjmyd).
// Si cambia la base, regenerar en vez de editar a mano.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          actualizado_en: string;
          contacto_nombre: string | null;
          creado_en: string;
          email: string | null;
          estado: string;
          id: string;
          inicio: string | null;
          monto_mensual: number | null;
          nombre: string;
          notas: string | null;
          plan_mensual: boolean;
          rubro: string | null;
          sitio_web: string | null;
          whatsapp: string | null;
        };
        Insert: {
          actualizado_en?: string;
          contacto_nombre?: string | null;
          creado_en?: string;
          email?: string | null;
          estado?: string;
          id?: string;
          inicio?: string | null;
          monto_mensual?: number | null;
          nombre: string;
          notas?: string | null;
          plan_mensual?: boolean;
          rubro?: string | null;
          sitio_web?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          actualizado_en?: string;
          contacto_nombre?: string | null;
          creado_en?: string;
          email?: string | null;
          estado?: string;
          id?: string;
          inicio?: string | null;
          monto_mensual?: number | null;
          nombre?: string;
          notas?: string | null;
          plan_mensual?: boolean;
          rubro?: string | null;
          sitio_web?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      diagnosticos: {
        Row: {
          creado_en: string;
          id: string;
          ip_hash: string | null;
          nota: number;
          por_categoria: Json;
          resultado: Json;
          url: string;
          url_final: string | null;
          user_agent: string | null;
        };
        Insert: {
          creado_en?: string;
          id?: string;
          ip_hash?: string | null;
          nota: number;
          por_categoria?: Json;
          resultado: Json;
          url: string;
          url_final?: string | null;
          user_agent?: string | null;
        };
        Update: {
          creado_en?: string;
          id?: string;
          ip_hash?: string | null;
          nota?: number;
          por_categoria?: Json;
          resultado?: Json;
          url?: string;
          url_final?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          actualizado_en: string;
          cliente_id: string | null;
          creado_en: string;
          diagnostico_id: string | null;
          email: string | null;
          empresa: string | null;
          estado: string;
          id: string;
          mensaje: string | null;
          nombre: string | null;
          notas: string | null;
          origen: string;
          proximo_contacto: string | null;
          sitio_web: string | null;
          whatsapp: string | null;
        };
        Insert: {
          actualizado_en?: string;
          cliente_id?: string | null;
          creado_en?: string;
          diagnostico_id?: string | null;
          email?: string | null;
          empresa?: string | null;
          estado?: string;
          id?: string;
          mensaje?: string | null;
          nombre?: string | null;
          notas?: string | null;
          origen?: string;
          proximo_contacto?: string | null;
          sitio_web?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          actualizado_en?: string;
          cliente_id?: string | null;
          creado_en?: string;
          diagnostico_id?: string | null;
          email?: string | null;
          empresa?: string | null;
          estado?: string;
          id?: string;
          mensaje?: string | null;
          nombre?: string | null;
          notas?: string | null;
          origen?: string;
          proximo_contacto?: string | null;
          sitio_web?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_diagnostico_id_fkey";
            columns: ["diagnostico_id"];
            isOneToOne: false;
            referencedRelation: "diagnosticos";
            referencedColumns: ["id"];
          },
        ];
      };
      pagos: {
        Row: {
          cliente_id: string;
          concepto: string;
          creado_en: string;
          estado: string;
          fecha: string;
          id: string;
          monto: number;
          proyecto_id: string | null;
        };
        Insert: {
          cliente_id: string;
          concepto: string;
          creado_en?: string;
          estado?: string;
          fecha?: string;
          id?: string;
          monto: number;
          proyecto_id?: string | null;
        };
        Update: {
          cliente_id?: string;
          concepto?: string;
          creado_en?: string;
          estado?: string;
          fecha?: string;
          id?: string;
          monto?: number;
          proyecto_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pagos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          creado_en: string;
          id: string;
          nombre: string;
          rol: string;
        };
        Insert: {
          creado_en?: string;
          id: string;
          nombre: string;
          rol?: string;
        };
        Update: {
          creado_en?: string;
          id?: string;
          nombre?: string;
          rol?: string;
        };
        Relationships: [];
      };
      proyectos: {
        Row: {
          actualizado_en: string;
          cliente_id: string;
          creado_en: string;
          entrega: string | null;
          estado: string;
          id: string;
          inicio: string | null;
          monto: number | null;
          nombre: string;
          notas: string | null;
          repositorio: string | null;
          tipo: string;
          url_produccion: string | null;
        };
        Insert: {
          actualizado_en?: string;
          cliente_id: string;
          creado_en?: string;
          entrega?: string | null;
          estado?: string;
          id?: string;
          inicio?: string | null;
          monto?: number | null;
          nombre: string;
          notas?: string | null;
          repositorio?: string | null;
          tipo?: string;
          url_produccion?: string | null;
        };
        Update: {
          actualizado_en?: string;
          cliente_id?: string;
          creado_en?: string;
          entrega?: string | null;
          estado?: string;
          id?: string;
          inicio?: string | null;
          monto?: number | null;
          nombre?: string;
          notas?: string | null;
          repositorio?: string | null;
          tipo?: string;
          url_produccion?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proyectos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      ping: { Args: never; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type Publico = Database["public"];

export type Fila<T extends keyof Publico["Tables"]> = Publico["Tables"][T]["Row"];
export type NuevaFila<T extends keyof Publico["Tables"]> = Publico["Tables"][T]["Insert"];
export type CambioFila<T extends keyof Publico["Tables"]> = Publico["Tables"][T]["Update"];
