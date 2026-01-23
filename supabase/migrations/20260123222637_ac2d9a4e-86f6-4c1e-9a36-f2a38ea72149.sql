-- Limpar todas as tabelas de dados na ordem correta (respeitando FKs)
DELETE FROM public.venda_itens;
DELETE FROM public.comanda_itens;
DELETE FROM public.fichas_tecnicas;
DELETE FROM public.contas;
DELETE FROM public.ordens_producao;
DELETE FROM public.vendas;
DELETE FROM public.comandas;
DELETE FROM public.produtos;
DELETE FROM public.clientes;