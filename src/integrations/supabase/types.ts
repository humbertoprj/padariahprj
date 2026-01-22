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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean | null
          cashback: number | null
          cpf_cnpj: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          limite_credito: number | null
          nome: string
          pontos: number | null
          saldo_fiado: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cashback?: number | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          limite_credito?: number | null
          nome: string
          pontos?: number | null
          saldo_fiado?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cashback?: number | null
          cpf_cnpj?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string
          pontos?: number | null
          saldo_fiado?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_itens: {
        Row: {
          comanda_id: string
          created_at: string | null
          desconto: number | null
          id: string
          observacao: string | null
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          comanda_id: string
          created_at?: string | null
          desconto?: number | null
          id?: string
          observacao?: string | null
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Update: {
          comanda_id?: string
          created_at?: string | null
          desconto?: number | null
          id?: string
          observacao?: string | null
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          closed_at: string | null
          created_at: string | null
          empresa_id: string
          id: string
          numero: number
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          closed_at?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          numero: number
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          closed_at?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          numero?: number
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          id: string
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          id?: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          id?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          capa_url: string | null
          cnpj: string | null
          created_at: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          razao_social: string | null
          taxa_credito_parcelado: number | null
          taxa_credito_vista: number | null
          taxa_debito: number | null
          taxa_pix: number | null
          taxa_voucher: number | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          capa_url?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          razao_social?: string | null
          taxa_credito_parcelado?: number | null
          taxa_credito_vista?: number | null
          taxa_debito?: number | null
          taxa_pix?: number | null
          taxa_voucher?: number | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          capa_url?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          razao_social?: string | null
          taxa_credito_parcelado?: number | null
          taxa_credito_vista?: number | null
          taxa_debito?: number | null
          taxa_pix?: number | null
          taxa_voucher?: number | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      fichas_tecnicas: {
        Row: {
          created_at: string | null
          id: string
          insumo_id: string
          perda_percentual: number | null
          produto_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          insumo_id: string
          perda_percentual?: number | null
          produto_id: string
          quantidade: number
        }
        Update: {
          created_at?: string | null
          id?: string
          insumo_id?: string
          perda_percentual?: number | null
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          created_at: string | null
          data_conclusao: string | null
          data_inicio: string | null
          data_prevista: string | null
          empresa_id: string
          id: string
          observacoes: string | null
          produto_id: string
          quantidade: number
          quantidade_produzida: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_prevista?: string | null
          empresa_id: string
          id?: string
          observacoes?: string | null
          produto_id: string
          quantidade: number
          quantidade_produzida?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_prevista?: string | null
          empresa_id?: string
          id?: string
          observacoes?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_produzida?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          codigo_barras: string | null
          created_at: string | null
          custo: number | null
          descricao: string | null
          empresa_id: string
          estoque_atual: number | null
          estoque_minimo: number | null
          fabricado: boolean | null
          id: string
          imagem_url: string | null
          margem: number | null
          nome: string
          preco: number | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          custo?: number | null
          descricao?: string | null
          empresa_id: string
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fabricado?: boolean | null
          id?: string
          imagem_url?: string | null
          margem?: number | null
          nome: string
          preco?: number | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          custo?: number | null
          descricao?: string | null
          empresa_id?: string
          estoque_atual?: number | null
          estoque_minimo?: number | null
          fabricado?: boolean | null
          id?: string
          imagem_url?: string | null
          margem?: number | null
          nome?: string
          preco?: number | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
      venda_itens: {
        Row: {
          created_at: string | null
          desconto: number | null
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          created_at?: string | null
          desconto?: number | null
          id?: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          created_at?: string | null
          desconto?: number | null
          id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          desconto: number | null
          empresa_id: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          status: string | null
          taxa_operadora: number | null
          usuario_id: string
          valor_bruto: number
          valor_liquido: number
          valor_recebido: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          empresa_id: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          status?: string | null
          taxa_operadora?: number | null
          usuario_id: string
          valor_bruto: number
          valor_liquido: number
          valor_recebido: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number | null
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          status?: string | null
          taxa_operadora?: number | null
          usuario_id?: string
          valor_bruto?: number
          valor_liquido?: number
          valor_recebido?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "caixa"
        | "vendedor"
        | "estoquista"
        | "financeiro"
        | "producao"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "admin",
        "caixa",
        "vendedor",
        "estoquista",
        "financeiro",
        "producao",
      ],
    },
  },
} as const
