import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.hprj.shop';
const supabaseAnonKey = 'your-anon-key-here'; // Você precisará configurar isso

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          razao_social: string | null;
          cnpj: string | null;
          telefone: string | null;
          whatsapp: string | null;
          endereco: string | null;
          logo_url: string | null;
          capa_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>;
      };
      produtos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          codigo_barras: string | null;
          categoria: string | null;
          unidade: string;
          custo: number;
          preco: number;
          margem: number;
          estoque_atual: number;
          estoque_minimo: number;
          fabricado: boolean;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>;
      };
      clientes: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cpf_cnpj: string | null;
          telefone: string | null;
          email: string | null;
          endereco: string | null;
          limite_credito: number;
          saldo_fiado: number;
          cashback: number;
          pontos: number;
          data_nascimento: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
      };
      vendas: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          usuario_id: string;
          valor_bruto: number;
          desconto: number;
          valor_liquido: number;
          forma_pagamento: string;
          taxa_operadora: number;
          valor_recebido: number;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vendas']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['vendas']['Insert']>;
      };
    };
  };
};
