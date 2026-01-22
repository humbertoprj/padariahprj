
-- Tabela de comandas
CREATE TABLE public.comandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    numero INTEGER NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nome TEXT,
    status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
    valor_total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (empresa_id, numero, status) -- Evita comandas duplicadas abertas
);

-- Tabela de itens da comanda
CREATE TABLE public.comanda_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comanda_id UUID REFERENCES public.comandas(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comandas
CREATE POLICY "Usuários podem ver comandas da empresa" ON public.comandas
    FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem inserir comandas na empresa" ON public.comandas
    FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem atualizar comandas da empresa" ON public.comandas
    FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Usuários podem deletar comandas da empresa" ON public.comandas
    FOR DELETE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- RLS Policies para comanda_itens
CREATE POLICY "Usuários podem ver itens de comandas da empresa" ON public.comanda_itens
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND c.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem inserir itens de comandas" ON public.comanda_itens
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND c.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem atualizar itens de comandas" ON public.comanda_itens
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND c.empresa_id = public.get_user_empresa_id(auth.uid())));

CREATE POLICY "Usuários podem deletar itens de comandas" ON public.comanda_itens
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND c.empresa_id = public.get_user_empresa_id(auth.uid())));

-- Índices para performance
CREATE INDEX idx_comandas_empresa_id ON public.comandas(empresa_id);
CREATE INDEX idx_comandas_numero ON public.comandas(numero);
CREATE INDEX idx_comandas_status ON public.comandas(status);
CREATE INDEX idx_comanda_itens_comanda_id ON public.comanda_itens(comanda_id);

-- Trigger para updated_at
CREATE TRIGGER update_comandas_updated_at BEFORE UPDATE ON public.comandas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular total da comanda
CREATE OR REPLACE FUNCTION public.atualizar_total_comanda()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comandas 
    SET valor_total = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM public.comanda_itens 
        WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    )
    WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar total automaticamente
CREATE TRIGGER atualizar_total_on_insert AFTER INSERT ON public.comanda_itens FOR EACH ROW EXECUTE FUNCTION public.atualizar_total_comanda();
CREATE TRIGGER atualizar_total_on_update AFTER UPDATE ON public.comanda_itens FOR EACH ROW EXECUTE FUNCTION public.atualizar_total_comanda();
CREATE TRIGGER atualizar_total_on_delete AFTER DELETE ON public.comanda_itens FOR EACH ROW EXECUTE FUNCTION public.atualizar_total_comanda();
