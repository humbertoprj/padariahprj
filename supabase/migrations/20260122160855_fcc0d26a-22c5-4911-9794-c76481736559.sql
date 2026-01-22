
-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'caixa', 'vendedor', 'estoquista', 'financeiro', 'producao');

-- Tabela de empresas
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    telefone TEXT,
    whatsapp TEXT,
    endereco TEXT,
    logo_url TEXT,
    capa_url TEXT,
    -- Taxas financeiras
    taxa_debito DECIMAL(5,2) DEFAULT 1.5,
    taxa_credito_vista DECIMAL(5,2) DEFAULT 3.0,
    taxa_credito_parcelado DECIMAL(5,2) DEFAULT 4.5,
    taxa_pix DECIMAL(5,2) DEFAULT 0.0,
    taxa_voucher DECIMAL(5,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de roles de usuário (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Tabela de produtos
CREATE TABLE public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo_barras TEXT,
    categoria TEXT,
    unidade TEXT DEFAULT 'UN',
    custo DECIMAL(12,2) DEFAULT 0,
    preco DECIMAL(12,2) DEFAULT 0,
    margem DECIMAL(5,2) DEFAULT 0,
    estoque_atual DECIMAL(12,3) DEFAULT 0,
    estoque_minimo DECIMAL(12,3) DEFAULT 0,
    fabricado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    limite_credito DECIMAL(12,2) DEFAULT 0,
    saldo_fiado DECIMAL(12,2) DEFAULT 0,
    cashback DECIMAL(12,2) DEFAULT 0,
    pontos INTEGER DEFAULT 0,
    data_nascimento DATE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    usuario_id UUID REFERENCES auth.users(id) NOT NULL,
    valor_bruto DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(12,2) DEFAULT 0,
    valor_liquido DECIMAL(12,2) NOT NULL,
    forma_pagamento TEXT NOT NULL,
    taxa_operadora DECIMAL(12,2) DEFAULT 0,
    valor_recebido DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'finalizada',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens da venda
CREATE TABLE public.venda_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ordens de produção
CREATE TABLE public.ordens_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL,
    quantidade_produzida DECIMAL(12,3) DEFAULT 0,
    status TEXT DEFAULT 'pendente',
    data_prevista DATE,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ficha técnica (insumos para produção)
CREATE TABLE public.fichas_tecnicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    insumo_id UUID REFERENCES public.produtos(id) NOT NULL,
    quantidade DECIMAL(12,4) NOT NULL,
    perda_percentual DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a pagar/receber
CREATE TABLE public.contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
    descricao TEXT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente',
    categoria TEXT,
    cliente_id UUID REFERENCES public.clientes(id),
    venda_id UUID REFERENCES public.vendas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Função para obter empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT empresa_id FROM public.profiles WHERE id = _user_id
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordens_producao_updated_at BEFORE UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para empresas
CREATE POLICY "Usuários podem ver sua empresa" ON public.empresas
    FOR SELECT USING (id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Admins podem atualizar sua empresa" ON public.empresas
    FOR UPDATE USING (id = public.get_user_empresa_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies para profiles
CREATE POLICY "Usuários podem ver seu perfil" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar seu perfil" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Permitir inserção de perfil no registro" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies para user_roles
CREATE POLICY "Usuários podem ver seus roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies para produtos
CREATE POLICY "Usuários podem ver produtos da empresa" ON public.produtos
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir produtos na empresa" ON public.produtos
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar produtos da empresa" ON public.produtos
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem deletar produtos da empresa" ON public.produtos
    FOR DELETE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- RLS Policies para clientes
CREATE POLICY "Usuários podem ver clientes da empresa" ON public.clientes
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir clientes na empresa" ON public.clientes
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar clientes da empresa" ON public.clientes
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem deletar clientes da empresa" ON public.clientes
    FOR DELETE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- RLS Policies para vendas
CREATE POLICY "Usuários podem ver vendas da empresa" ON public.vendas
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir vendas na empresa" ON public.vendas
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()) AND usuario_id = auth.uid());

CREATE POLICY "Usuários podem atualizar vendas da empresa" ON public.vendas
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- RLS Policies para venda_itens
CREATE POLICY "Usuários podem ver itens de vendas da empresa" ON public.venda_itens
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem inserir itens de vendas" ON public.venda_itens
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = public.get_user_empresa_id(auth.uid())));

-- RLS Policies para ordens_producao
CREATE POLICY "Usuários podem ver OPs da empresa" ON public.ordens_producao
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir OPs na empresa" ON public.ordens_producao
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar OPs da empresa" ON public.ordens_producao
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- RLS Policies para fichas_tecnicas
CREATE POLICY "Usuários podem ver fichas técnicas" ON public.fichas_tecnicas
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem inserir fichas técnicas" ON public.fichas_tecnicas
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem atualizar fichas técnicas" ON public.fichas_tecnicas
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem deletar fichas técnicas" ON public.fichas_tecnicas
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_id AND p.empresa_id = public.get_user_empresa_id(auth.uid())));

-- RLS Policies para contas
CREATE POLICY "Usuários podem ver contas da empresa" ON public.contas
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir contas na empresa" ON public.contas
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar contas da empresa" ON public.contas
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem deletar contas da empresa" ON public.contas
    FOR DELETE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- Criar índices para performance
CREATE INDEX idx_produtos_empresa_id ON public.produtos(empresa_id);
CREATE INDEX idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX idx_vendas_empresa_id ON public.vendas(empresa_id);
CREATE INDEX idx_vendas_created_at ON public.vendas(created_at);
CREATE INDEX idx_venda_itens_venda_id ON public.venda_itens(venda_id);
CREATE INDEX idx_ordens_producao_empresa_id ON public.ordens_producao(empresa_id);
CREATE INDEX idx_contas_empresa_id ON public.contas(empresa_id);
CREATE INDEX idx_contas_data_vencimento ON public.contas(data_vencimento);
