import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Ticket,
  User,
  X,
  ArrowLeft,
  Percent,
  Receipt,
  Check,
  Package,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Calculator,
  Split,
  ClipboardList,
  Scale,
} from 'lucide-react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';
import { Link } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';
import { parseCodigoBalanca, encontrarProdutoPorCodigoBalanca, isCodigoBalanca } from '@/utils/barcodeParser';
import { useToast } from '@/hooks/use-toast';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  codigoBarras: string;
  estoque: number;
}

interface ItemComanda {
  id: string;
  produto: Produto;
  quantidade: number;
  desconto: number;
  observacao?: string;
}

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
}

interface Comanda {
  numero: number;
  clienteNome: string;
  clienteId?: string;
  itens: ItemComanda[];
  status: 'aberta' | 'fechada';
  createdAt: Date;
}

interface PagamentoDuplo {
  forma1: string;
  valor1: number;
  forma2: string;
  valor2: number;
}

const formasPagamento = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'debito', label: 'Débito', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: Smartphone },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
  { id: 'fiado', label: 'Fiado', icon: User },
];

// Gerar array de comandas 1-100
const TOTAL_COMANDAS = 50;

export default function PDV() {
  const { empresa, configFinanceira } = useEmpresa();
  const { toast } = useToast();
  const [view, setView] = useState<'comandas' | 'produtos' | 'pagamento'>('comandas');
  const [comandas, setComandas] = useState<Map<number, Comanda>>(new Map());
  const [comandaSelecionada, setComandaSelecionada] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [buscaComanda, setBuscaComanda] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [formaPagamento, setFormaPagamento] = useState<string | null>(null);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [nomeCliente, setNomeCliente] = useState('');
  const [mobileTab, setMobileTab] = useState<'produtos' | 'comanda'>('produtos');
  
  // Estado para produtos do estoque
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>(['Todas']);

  // Estado para clientes (fiado)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [showSeletorCliente, setShowSeletorCliente] = useState(false);

  // Estado para pagamento em dinheiro (troco)
  const [valorRecebido, setValorRecebido] = useState<number>(0);
  const [showTroco, setShowTroco] = useState(false);

  // Estado para pagamento duplo
  const [usarPagamentoDuplo, setUsarPagamentoDuplo] = useState(false);
  const [pagamentoDuplo, setPagamentoDuplo] = useState<PagamentoDuplo>({
    forma1: 'dinheiro',
    valor1: 0,
    forma2: 'pix',
    valor2: 0,
  });

  // Estado para buscar comanda do servidor
  const [buscandoComandaServidor, setBuscandoComandaServidor] = useState(false);
  const [inputBuscaComandaServidor, setInputBuscaComandaServidor] = useState('');

  // Estado para código de balança
  const [ultimoCodigoBalanca, setUltimoCodigoBalanca] = useState<string | null>(null);

  // Carregar produtos do estoque via API
  useEffect(() => {
    const carregarProdutos = async () => {
      setLoadingProdutos(true);
      setErroProdutos(null);
      
      const response = await api.get<any[]>(API_ENDPOINTS.produtos);
      
      if (response.error) {
        setErroProdutos(response.error);
        setProdutos([]);
      } else if (response.data) {
        const produtosMapeados: Produto[] = response.data
          .filter((p: any) => p.ativo !== false)
          .map((p: any) => ({
            id: p.id,
            nome: p.nome,
            preco: p.preco_venda || p.preco || 0,
            categoria: p.categoria || 'Outros',
            codigoBarras: p.codigo_barras || p.id,
            estoque: p.estoque_atual || p.estoque || 0,
          }));
        
        setProdutos(produtosMapeados);
        const categoriasUnicas = ['Todas', ...new Set(produtosMapeados.map(p => p.categoria))];
        setCategorias(categoriasUnicas);
      } else {
        setProdutos([]);
      }
      
      setLoadingProdutos(false);
    };
    
    carregarProdutos();
  }, []);

  // Carregar clientes para fiado
  useEffect(() => {
    const carregarClientes = async () => {
      const response = await api.get<any[]>(API_ENDPOINTS.clientes);
      if (response.data) {
        setClientes(response.data.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          cpf_cnpj: c.cpf_cnpj,
          telefone: c.telefone,
        })));
      }
    };
    carregarClientes();
  }, []);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchBusca =
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigoBarras.includes(busca);
      const matchCategoria = categoriaSelecionada === 'Todas' || produto.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada, produtos]);

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes;
    const termo = buscaCliente.toLowerCase();
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(termo) ||
      c.cpf_cnpj?.includes(termo) ||
      c.telefone?.includes(termo)
    );
  }, [clientes, buscaCliente]);

  // Obter comanda atual
  const comandaAtual = comandaSelecionada ? comandas.get(comandaSelecionada) : null;

  // Calcular totais da comanda
  const subtotal = comandaAtual?.itens.reduce((total, item) => {
    const valorItem = item.produto.preco * item.quantidade;
    const desconto = (valorItem * item.desconto) / 100;
    return total + (valorItem - desconto);
  }, 0) || 0;

  const valorDesconto = (subtotal * descontoGeral) / 100;
  const total = subtotal - valorDesconto;

  // Calcular troco
  const troco = valorRecebido > total ? valorRecebido - total : 0;

  const getTaxaOperadora = (forma: string) => {
    switch (forma) {
      case 'debito': return configFinanceira.taxaDebito;
      case 'credito': return configFinanceira.taxaCreditoVista;
      case 'pix': return configFinanceira.taxaPix;
      case 'voucher': return configFinanceira.taxaVoucher;
      default: return 0;
    }
  };

  const taxa = formaPagamento ? getTaxaOperadora(formaPagamento) : 0;
  const valorTaxa = (total * taxa) / 100;
  const valorLiquido = total - valorTaxa;

  // Para pagamento duplo
  const calcularTaxaDupla = () => {
    const taxa1 = getTaxaOperadora(pagamentoDuplo.forma1);
    const taxa2 = getTaxaOperadora(pagamentoDuplo.forma2);
    const valorTaxa1 = (pagamentoDuplo.valor1 * taxa1) / 100;
    const valorTaxa2 = (pagamentoDuplo.valor2 * taxa2) / 100;
    return valorTaxa1 + valorTaxa2;
  };

  // Validar se fiado tem cliente selecionado
  const podeFinalizarFiado = formaPagamento !== 'fiado' || clienteSelecionado !== null;

  // Validar pagamento duplo
  const pagamentoDuploValido = !usarPagamentoDuplo || 
    (pagamentoDuplo.valor1 + pagamentoDuplo.valor2 >= total * 0.99); // 99% para margem de arredondamento

  // Abrir/Selecionar comanda
  const selecionarComanda = (numero: number) => {
    if (!comandas.has(numero)) {
      setComandas(new Map(comandas.set(numero, {
        numero,
        clienteNome: '',
        itens: [],
        status: 'aberta',
        createdAt: new Date(),
      })));
    }
    setComandaSelecionada(numero);
    setView('produtos');
    setDescontoGeral(0);
    setFormaPagamento(null);
    setClienteSelecionado(null);
    setValorRecebido(0);
    setUsarPagamentoDuplo(false);
  };

  // Adicionar produto à comanda
  const adicionarProduto = (produto: Produto) => {
    if (!comandaSelecionada || !comandaAtual) return;

    const itemExistente = comandaAtual.itens.find(i => i.produto.id === produto.id);
    
    if (itemExistente) {
      const novosItens = comandaAtual.itens.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
      setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
    } else {
      const novoItem: ItemComanda = {
        id: crypto.randomUUID(),
        produto,
        quantidade: 1,
        desconto: 0,
      };
      setComandas(new Map(comandas.set(comandaSelecionada, {
        ...comandaAtual,
        itens: [...comandaAtual.itens, novoItem],
      })));
    }
  };

  // Adicionar produto com quantidade e preço específicos (para balança)
  const adicionarProdutoComValor = (produto: Produto, valor: number) => {
    if (!comandaSelecionada || !comandaAtual) return;

    // Para produtos de balança, o valor já vem calculado
    // Criamos um produto temporário com o preço do valor total
    const novoItem: ItemComanda = {
      id: crypto.randomUUID(),
      produto: { ...produto, preco: valor },
      quantidade: 1,
      desconto: 0,
      observacao: `Balança: R$ ${valor.toFixed(2)}`,
    };
    
    setComandas(new Map(comandas.set(comandaSelecionada, {
      ...comandaAtual,
      itens: [...comandaAtual.itens, novoItem],
    })));
    
    toast({
      title: 'Produto de balança adicionado',
      description: `${produto.nome} - R$ ${valor.toFixed(2)}`,
    });
  };

  // Processar código de barras (incluindo balança)
  const processarCodigoBarras = useCallback((codigo: string) => {
    if (!codigo.trim()) return;

    // Verificar se é código de balança (começa com 2 e tem 13 dígitos)
    if (isCodigoBalanca(codigo)) {
      const parsed = parseCodigoBalanca(codigo);
      
      if (parsed.tipo === 'balanca_preco' && parsed.valor) {
        // Buscar produto pelo código extraído
        const produtoEncontrado = encontrarProdutoPorCodigoBalanca(
          produtos.map(p => ({ ...p, codigo_barras: p.codigoBarras })),
          parsed.codigoProduto
        );
        
        if (produtoEncontrado) {
          adicionarProdutoComValor(produtoEncontrado as unknown as Produto, parsed.valor);
          setUltimoCodigoBalanca(codigo);
          setBusca('');
          return;
        } else {
          // Criar produto genérico de balança
          const produtoBalanca: Produto = {
            id: `balanca-${Date.now()}`,
            nome: `Produto Balança (${parsed.codigoProduto})`,
            preco: parsed.valor,
            categoria: 'Balança',
            codigoBarras: parsed.codigoProduto,
            estoque: 999,
          };
          adicionarProdutoComValor(produtoBalanca, parsed.valor);
          setUltimoCodigoBalanca(codigo);
          setBusca('');
          
          toast({
            title: 'Produto de balança',
            description: `Código ${parsed.codigoProduto} - R$ ${parsed.valor.toFixed(2)}`,
          });
          return;
        }
      }
    }

    // Buscar produto normal pelo código de barras
    const produtoEncontrado = produtos.find(p => 
      p.codigoBarras === codigo || p.id === codigo
    );
    
    if (produtoEncontrado) {
      adicionarProduto(produtoEncontrado);
      setBusca('');
    }
  }, [produtos, comandaSelecionada, comandaAtual]);

  // Buscar comanda do servidor local
  const buscarComandaServidor = async (numeroOuCodigo: string) => {
    if (!numeroOuCodigo.trim()) return;
    
    setBuscandoComandaServidor(true);
    
    try {
      // Tentar buscar como número
      const numero = parseInt(numeroOuCodigo, 10);
      
      // Buscar todas as comandas abertas
      const response = await api.get<any[]>(API_ENDPOINTS.comandas);
      
      if (response.error) {
        toast({
          title: 'Erro ao buscar comanda',
          description: response.status === 0 
            ? 'Servidor Local não encontrado'
            : response.error,
          variant: 'destructive',
        });
        setBuscandoComandaServidor(false);
        return;
      }
      
      // Encontrar comanda pelo número
      const comandaServidor = response.data?.find((c: any) => 
        c.numero === numero && c.status === 'aberta'
      );
      
      if (!comandaServidor) {
        toast({
          title: 'Comanda não encontrada',
          description: `Nenhuma comanda aberta com número ${numero}`,
          variant: 'destructive',
        });
        setBuscandoComandaServidor(false);
        return;
      }
      
      // Buscar itens da comanda
      const itensResponse = await api.get<any[]>(API_ENDPOINTS.comandaItens(comandaServidor.id));
      
      if (itensResponse.data && itensResponse.data.length > 0) {
        // Mapear itens para o formato local
        const itensImportados: ItemComanda[] = itensResponse.data.map((item: any) => {
          const produtoLocal = produtos.find(p => p.id === item.produto_id);
          return {
            id: crypto.randomUUID(),
            produto: produtoLocal || {
              id: item.produto_id,
              nome: item.produto_nome || 'Produto',
              preco: item.preco_unitario || 0,
              categoria: 'Importado',
              codigoBarras: '',
              estoque: 999,
            },
            quantidade: item.quantidade,
            desconto: item.desconto || 0,
            observacao: item.observacao,
          };
        });
        
        // Criar ou atualizar comanda local
        const novaComanda: Comanda = {
          numero,
          clienteNome: comandaServidor.cliente_nome || '',
          clienteId: comandaServidor.cliente_id,
          itens: itensImportados,
          status: 'aberta',
          createdAt: new Date(comandaServidor.created_at),
        };
        
        setComandas(new Map(comandas.set(numero, novaComanda)));
        setComandaSelecionada(numero);
        setView('produtos');
        setInputBuscaComandaServidor('');
        
        toast({
          title: 'Comanda importada!',
          description: `Comanda ${numero} com ${itensImportados.length} item(ns) importada do servidor.`,
        });
      } else {
        toast({
          title: 'Comanda vazia',
          description: `A comanda ${numero} não possui itens.`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar comanda:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar comanda do servidor.',
        variant: 'destructive',
      });
    }
    
    setBuscandoComandaServidor(false);
  };

  // Handler para Enter no campo de busca (processar código de barras)
  const handleBuscaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busca.trim()) {
      processarCodigoBarras(busca.trim());
    }
  };

  // Alterar quantidade
  const alterarQuantidade = (itemId: string, delta: number) => {
    if (!comandaSelecionada || !comandaAtual) return;

    const novosItens = comandaAtual.itens
      .map(item => item.id === itemId ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item)
      .filter(item => item.quantidade > 0);

    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
  };

  // Remover item
  const removerItem = (itemId: string) => {
    if (!comandaSelecionada || !comandaAtual) return;
    const novosItens = comandaAtual.itens.filter(item => item.id !== itemId);
    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
  };

  // Atualizar nome do cliente
  const atualizarNomeCliente = (nome: string) => {
    if (!comandaSelecionada || !comandaAtual) return;
    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, clienteNome: nome })));
  };

  // Selecionar cliente para fiado
  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    atualizarNomeCliente(cliente.nome);
    setShowSeletorCliente(false);
    setBuscaCliente('');
  };

  // Estado para salvar venda
  const [salvandoVenda, setSalvandoVenda] = useState(false);

  // Mensagem padrão de erro de conexão
  const ERRO_SERVIDOR_OFFLINE = 'Erro: Servidor Local não encontrado. Certifique-se de que o CMD está aberto no computador principal.';

  // Finalizar venda via API local
  const finalizarVenda = async () => {
    if (!comandaSelecionada || !comandaAtual) return;
    
    // Validar forma de pagamento
    if (!usarPagamentoDuplo && !formaPagamento) return;
    
    // Validar fiado com cliente
    if (formaPagamento === 'fiado' && !clienteSelecionado) {
      alert('Para venda no fiado, é obrigatório selecionar um cliente cadastrado.');
      return;
    }

    // Validar valor recebido para dinheiro
    if (formaPagamento === 'dinheiro' && valorRecebido < total) {
      alert('O valor recebido deve ser maior ou igual ao total da venda.');
      return;
    }
    
    setSalvandoVenda(true);
    
    // Montar payload para API local
    const payload: any = {
      comanda_numero: comandaSelecionada,
      cliente_nome: comandaAtual.clienteNome || clienteSelecionado?.nome || null,
      cliente_id: clienteSelecionado?.id || null,
      valor_bruto: subtotal,
      desconto: descontoGeral,
      valor_desconto: valorDesconto,
      valor_total: total,
      itens: comandaAtual.itens.map(item => ({
        produto_id: item.produto.id,
        produto_nome: item.produto.nome,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        desconto: item.desconto,
        subtotal: item.produto.preco * item.quantidade,
      })),
    };

    if (usarPagamentoDuplo) {
      // Pagamento duplo
      payload.pagamento_duplo = true;
      payload.forma_pagamento_1 = pagamentoDuplo.forma1;
      payload.valor_pagamento_1 = pagamentoDuplo.valor1;
      payload.forma_pagamento_2 = pagamentoDuplo.forma2;
      payload.valor_pagamento_2 = pagamentoDuplo.valor2;
      payload.taxa_operadora = calcularTaxaDupla();
      payload.valor_liquido = total - calcularTaxaDupla();
    } else {
      // Pagamento simples
      payload.forma_pagamento = formaPagamento;
      payload.taxa_operadora = taxa;
      payload.valor_taxa = valorTaxa;
      payload.valor_liquido = valorLiquido;
      
      // Dados específicos para dinheiro
      if (formaPagamento === 'dinheiro') {
        payload.valor_recebido = valorRecebido;
        payload.troco = troco;
      }
    }
    
    const response = await api.post<any>(API_ENDPOINTS.vendas, payload);
    
    if (response.error) {
      alert(response.status === 0 ? ERRO_SERVIDOR_OFFLINE : `Erro ao finalizar venda: ${response.error}`);
      setSalvandoVenda(false);
      return;
    }
    
    // BAIXA AUTOMÁTICA DE ESTOQUE - Enviar PATCH para cada produto vendido
    try {
      for (const item of comandaAtual.itens) {
        const produtoAtual = produtos.find(p => p.id === item.produto.id);
        if (produtoAtual) {
          const novoEstoque = Math.max(0, produtoAtual.estoque - item.quantidade);
          await api.patch<any>(API_ENDPOINTS.produto(item.produto.id), {
            estoque_atual: novoEstoque
          });
        }
      }
      console.log('✅ Estoque atualizado para todos os itens vendidos');
    } catch (estoqueError) {
      console.warn('⚠️ Erro ao atualizar estoque (venda já registrada):', estoqueError);
    }
    
    // REGISTRAR FIADO NO CLIENTE - Atualizar saldo_fiado
    if (formaPagamento === 'fiado' && clienteSelecionado) {
      try {
        await api.patch<any>(API_ENDPOINTS.cliente(clienteSelecionado.id), {
          saldo_fiado: (clienteSelecionado as any).saldo_fiado + total || total
        });
        console.log('✅ Saldo fiado atualizado para cliente:', clienteSelecionado.nome);
      } catch (fiadoError) {
        console.warn('⚠️ Erro ao atualizar saldo fiado:', fiadoError);
      }
    }
    
    // Sucesso - limpar comanda
    const novasComandas = new Map(comandas);
    novasComandas.delete(comandaSelecionada);
    setComandas(novasComandas);
    
    let mensagem = `✅ Venda finalizada com sucesso!\n\nComanda: ${comandaSelecionada}\nValor: R$ ${total.toFixed(2).replace('.', ',')}`;
    
    if (formaPagamento === 'dinheiro' && troco > 0) {
      mensagem += `\n\n💵 TROCO: R$ ${troco.toFixed(2).replace('.', ',')}`;
    }
    
    alert(mensagem);
    
    setComandaSelecionada(null);
    setView('comandas');
    setFormaPagamento(null);
    setDescontoGeral(0);
    setClienteSelecionado(null);
    setValorRecebido(0);
    setUsarPagamentoDuplo(false);
    setSalvandoVenda(false);
  };

  // Cancelar comanda
  const cancelarComanda = () => {
    if (!comandaSelecionada) return;
    if (confirm(`Deseja cancelar a comanda ${comandaSelecionada}?`)) {
      const novasComandas = new Map(comandas);
      novasComandas.delete(comandaSelecionada);
      setComandas(novasComandas);
      setComandaSelecionada(null);
      setView('comandas');
    }
  };

  // Comandas abertas
  const comandasAbertas = Array.from(comandas.values()).filter(c => c.status === 'aberta');

  // Filtrar comandas na busca
  const comandasFiltradas = buscaComanda
    ? Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1).filter(n => 
        n.toString().includes(buscaComanda) || 
        comandas.get(n)?.clienteNome.toLowerCase().includes(buscaComanda.toLowerCase())
      )
    : Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1);

  // Quando mudar forma de pagamento
  const handleFormaPagamento = (forma: string) => {
    setFormaPagamento(forma);
    setUsarPagamentoDuplo(false);
    
    if (forma === 'fiado') {
      setShowSeletorCliente(true);
    } else {
      setShowSeletorCliente(false);
    }
    
    if (forma === 'dinheiro') {
      setShowTroco(true);
      setValorRecebido(total);
    } else {
      setShowTroco(false);
      setValorRecebido(0);
    }
  };

  // Ativar pagamento duplo
  const ativarPagamentoDuplo = () => {
    setUsarPagamentoDuplo(true);
    setFormaPagamento(null);
    setPagamentoDuplo({
      forma1: 'dinheiro',
      valor1: Math.floor(total / 2),
      forma2: 'pix',
      valor2: total - Math.floor(total / 2),
    });
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header do PDV */}
      <header className="h-14 bg-sidebar flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-sidebar-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              {empresa?.nome?.charAt(0) || 'E'}
            </div>
            <span className="text-sidebar-foreground font-semibold">{empresa?.nome || 'Empresa'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {comandaSelecionada && (
            <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-lg">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">Comanda {comandaSelecionada}</span>
            </div>
          )}
          <span className="text-sidebar-foreground/60 text-sm">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="badge-success">Caixa Aberto</div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      {view === 'comandas' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Header das Comandas */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Selecione uma Comanda</h2>
              <p className="text-muted-foreground">
                {comandasAbertas.length} comanda(s) aberta(s) • Total: R$ {comandasAbertas.reduce((t, c) => t + (c.itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0)), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Buscar Comanda do Servidor */}
              <div className="flex gap-2">
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar comanda do servidor..."
                    value={inputBuscaComandaServidor}
                    onChange={(e) => setInputBuscaComandaServidor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarComandaServidor(inputBuscaComandaServidor)}
                    className="input-field pl-10 w-56"
                  />
                </div>
                <button
                  onClick={() => buscarComandaServidor(inputBuscaComandaServidor)}
                  disabled={buscandoComandaServidor || !inputBuscaComandaServidor.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {buscandoComandaServidor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-1" />
                      Importar
                    </>
                  )}
                </button>
              </div>
              
              {/* Busca Local */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={buscaComanda}
                  onChange={(e) => setBuscaComanda(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              
              {/* Link para tela de Comandas (Tablet) */}
              <Link to="/comandas" className="btn-secondary whitespace-nowrap">
                <ClipboardList className="w-4 h-4 mr-1" />
                Lançar Itens
              </Link>
            </div>
          </div>

          {/* Grid de Comandas */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
              {comandasFiltradas.map((numero) => {
                const comanda = comandas.get(numero);
                const temItens = comanda && comanda.itens.length > 0;
                const valorComanda = comanda?.itens.reduce((t, i) => t + i.produto.preco * i.quantidade, 0) || 0;

                return (
                  <button
                    key={numero}
                    onClick={() => selecionarComanda(numero)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all hover:scale-105',
                      temItens
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="text-2xl">{numero}</span>
                    {temItens && (
                      <span className="text-xs opacity-80">
                        R$ {valorComanda.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(view === 'produtos' || view === 'pagamento') && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex border-b border-border bg-card">
            <button
              onClick={() => setMobileTab('produtos')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                mobileTab === 'produtos'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground'
              )}
            >
              <Package className="w-4 h-4" />
              Produtos
            </button>
            <button
              onClick={() => setMobileTab('comanda')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative',
                mobileTab === 'comanda'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Comanda
              {comandaAtual && comandaAtual.itens.length > 0 && (
                <span className="absolute -top-1 right-1/4 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {comandaAtual.itens.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Área de Produtos - hidden on mobile when comanda tab is active */}
            <div className={cn(
              "flex-1 flex flex-col p-4 overflow-hidden",
              mobileTab === 'comanda' ? 'hidden md:flex' : 'flex'
            )}>
              {/* Busca e Filtros */}
              <div className="flex gap-2 md:gap-4 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    setComandaSelecionada(null);
                    setView('comandas');
                  }}
                  className="btn-secondary text-sm md:text-base"
                >
                  <Receipt className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Comandas</span>
                </button>
                <div className="relative flex-1 min-w-0">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Código de barras ou nome do produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleBuscaKeyDown}
                    className="input-field pl-10 md:pl-11 text-sm md:text-lg w-full"
                    autoFocus
                  />
                  {busca && isCodigoBalanca(busca) && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-warning/20 text-warning px-2 py-0.5 rounded text-xs font-medium">
                      Balança
                    </div>
                  )}
                </div>
              </div>

              {/* Categorias */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSelecionada(cat)}
                    className={cn(
                      'px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors',
                      categoriaSelecionada === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Produtos */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {loadingProdutos ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Carregando produtos...</p>
                  </div>
                ) : erroProdutos ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
                    <AlertCircle className="w-12 h-12" />
                    <p className="font-medium">Erro ao carregar produtos</p>
                    <p className="text-sm text-muted-foreground">{erroProdutos}</p>
                  </div>
                ) : produtosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <Package className="w-12 h-12" />
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm">Cadastre produtos no Estoque para exibir aqui</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                    {produtosFiltrados.map((produto) => (
                      <button
                        key={produto.id}
                        onClick={() => {
                          adicionarProduto(produto);
                          if (window.innerWidth < 768) {
                            setMobileTab('comanda');
                          }
                        }}
                        className="pdv-product-card text-left p-2 md:p-3"
                      >
                        <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                          <Package className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{produto.categoria}</p>
                        <p className="text-sm md:text-lg font-bold text-primary mt-1">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Painel da Comanda - hidden on mobile when produtos tab is active */}
            <div className={cn(
              "w-full md:w-96 bg-card md:border-l border-border flex flex-col",
              mobileTab === 'produtos' ? 'hidden md:flex' : 'flex'
            )}>
              {/* Header da Comanda */}
              <div className="p-4 border-b border-border bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Comanda {comandaSelecionada}</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">{comandaAtual?.itens.length || 0} itens</span>
                </div>
                {/* Nome do Cliente */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nome do cliente (opcional)"
                    value={comandaAtual?.clienteNome || ''}
                    onChange={(e) => atualizarNomeCliente(e.target.value)}
                    className="flex-1 bg-transparent border-b border-border text-sm py-1 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Lista de Itens */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {!comandaAtual?.itens.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p>Comanda vazia</p>
                    <p className="text-sm">Adicione produtos</p>
                    <button
                      onClick={() => setMobileTab('produtos')}
                      className="mt-4 btn-primary md:hidden"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Ver Produtos
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {comandaAtual.itens.map((item) => (
                      <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{item.produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.produto.preco.toFixed(2).replace('.', ',')} cada
                            </p>
                          </div>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidade(item.id, -1)}
                              className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantidade}</span>
                            <button
                              onClick={() => alterarQuantidade(item.id, 1)}
                              className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-semibold text-foreground">
                            R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totais e Pagamento */}
              {comandaAtual && comandaAtual.itens.length > 0 && (
                <div className="p-4 border-t border-border bg-muted/30 space-y-4">
                  {view === 'pagamento' && (
                    <>
                      {/* Desconto Geral */}
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={descontoGeral}
                          onChange={(e) => setDescontoGeral(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-sm border border-input rounded"
                        />
                        <span className="text-sm text-muted-foreground">% desconto</span>
                      </div>

                      {/* Opção de pagamento duplo */}
                      <button
                        onClick={ativarPagamentoDuplo}
                        className={cn(
                          'w-full p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors',
                          usarPagamentoDuplo
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        <Split className="w-4 h-4" />
                        Pagar com 2 formas
                      </button>

                      {usarPagamentoDuplo ? (
                        // Pagamento Duplo
                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium text-foreground">Pagamento Duplo</p>
                          
                          {/* Primeira forma */}
                          <div className="space-y-2">
                            <select
                              value={pagamentoDuplo.forma1}
                              onChange={(e) => setPagamentoDuplo({ ...pagamentoDuplo, forma1: e.target.value })}
                              className="input-field text-sm"
                            >
                              {formasPagamento.filter(f => f.id !== 'fiado').map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">R$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pagamentoDuplo.valor1}
                                onChange={(e) => {
                                  const v1 = Number(e.target.value);
                                  setPagamentoDuplo({ 
                                    ...pagamentoDuplo, 
                                    valor1: v1,
                                    valor2: Math.max(0, total - v1),
                                  });
                                }}
                                className="flex-1 input-field text-sm"
                              />
                            </div>
                          </div>

                          <div className="border-t border-border my-2" />

                          {/* Segunda forma */}
                          <div className="space-y-2">
                            <select
                              value={pagamentoDuplo.forma2}
                              onChange={(e) => setPagamentoDuplo({ ...pagamentoDuplo, forma2: e.target.value })}
                              className="input-field text-sm"
                            >
                              {formasPagamento.filter(f => f.id !== 'fiado').map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">R$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pagamentoDuplo.valor2}
                                onChange={(e) => {
                                  const v2 = Number(e.target.value);
                                  setPagamentoDuplo({ 
                                    ...pagamentoDuplo, 
                                    valor2: v2,
                                    valor1: Math.max(0, total - v2),
                                  });
                                }}
                                className="flex-1 input-field text-sm"
                              />
                            </div>
                          </div>

                          {/* Soma dos valores */}
                          <div className="flex justify-between text-sm pt-2 border-t border-border">
                            <span className="text-muted-foreground">Soma:</span>
                            <span className={cn(
                              'font-medium',
                              pagamentoDuplo.valor1 + pagamentoDuplo.valor2 >= total * 0.99
                                ? 'text-success'
                                : 'text-destructive'
                            )}>
                              R$ {(pagamentoDuplo.valor1 + pagamentoDuplo.valor2).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Formas de Pagamento Simples */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Forma de pagamento:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {formasPagamento.map((forma) => (
                                <button
                                  key={forma.id}
                                  onClick={() => handleFormaPagamento(forma.id)}
                                  className={cn(
                                    'p-2 md:p-3 rounded-lg flex flex-col items-center gap-1 transition-colors',
                                    formaPagamento === forma.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                  )}
                                >
                                  <forma.icon className="w-4 md:w-5 h-4 md:h-5" />
                                  <span className="text-xs font-medium">{forma.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Seletor de Cliente para Fiado */}
                          {formaPagamento === 'fiado' && (
                            <div className="space-y-2 p-3 bg-warning/10 rounded-lg border border-warning/30">
                              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Selecionar Cliente (obrigatório)
                              </p>
                              
                              {clienteSelecionado ? (
                                <div className="flex items-center justify-between p-2 bg-background rounded">
                                  <div>
                                    <p className="font-medium text-foreground">{clienteSelecionado.nome}</p>
                                    <p className="text-xs text-muted-foreground">{clienteSelecionado.telefone || clienteSelecionado.cpf_cnpj}</p>
                                  </div>
                                  <button 
                                    onClick={() => setClienteSelecionado(null)}
                                    className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Buscar cliente por nome, CPF ou telefone..."
                                    value={buscaCliente}
                                    onChange={(e) => setBuscaCliente(e.target.value)}
                                    className="input-field text-sm"
                                  />
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {clientesFiltrados.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-2">
                                        Nenhum cliente encontrado
                                      </p>
                                    ) : (
                                      clientesFiltrados.slice(0, 5).map(cliente => (
                                        <button
                                          key={cliente.id}
                                          onClick={() => selecionarCliente(cliente)}
                                          className="w-full p-2 text-left bg-background hover:bg-accent rounded text-sm"
                                        >
                                          <p className="font-medium">{cliente.nome}</p>
                                          <p className="text-xs text-muted-foreground">{cliente.telefone || cliente.cpf_cnpj}</p>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Campo de Valor Recebido para Dinheiro */}
                          {formaPagamento === 'dinheiro' && (
                            <div className="space-y-2 p-3 bg-success/10 rounded-lg border border-success/30">
                              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Valor Recebido
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={valorRecebido}
                                  onChange={(e) => setValorRecebido(Number(e.target.value))}
                                  className="flex-1 input-field text-lg font-bold"
                                  placeholder="0,00"
                                />
                              </div>
                              {valorRecebido >= total && troco > 0 && (
                                <div className="flex justify-between items-center p-2 bg-success/20 rounded-lg mt-2">
                                  <span className="text-success font-medium">TROCO:</span>
                                  <span className="text-xl font-bold text-success">
                                    R$ {troco.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              )}
                              {valorRecebido < total && valorRecebido > 0 && (
                                <p className="text-xs text-destructive">
                                  Faltam R$ {(total - valorRecebido).toFixed(2).replace('.', ',')}
                                </p>
                              )}
                            </div>
                          )}

                          {formaPagamento && taxa > 0 && (
                            <div className="p-3 bg-warning/10 rounded-lg text-sm">
                              <div className="flex justify-between text-warning">
                                <span>Taxa ({taxa}%)</span>
                                <span>-R$ {valorTaxa.toFixed(2).replace('.', ',')}</span>
                              </div>
                              <div className="flex justify-between font-medium text-foreground mt-1">
                                <span>Valor líquido</span>
                                <span>R$ {valorLiquido.toFixed(2).replace('.', ',')}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Totais */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {descontoGeral > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-success">Desconto ({descontoGeral}%)</span>
                        <span className="text-success">-R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    {view === 'produtos' ? (
                      <>
                        <button
                          onClick={cancelarComanda}
                          className="btn-secondary flex-1 py-3 text-sm md:text-base"
                        >
                          <X className="w-4 h-4 mr-1 md:mr-2" />
                          Cancelar
                        </button>
                        <button
                          onClick={() => setView('pagamento')}
                          className="btn-primary flex-1 py-3 text-sm md:text-base"
                        >
                          <CreditCard className="w-4 h-4 mr-1 md:mr-2" />
                          Fechar Conta
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setView('produtos')}
                          className="btn-secondary flex-1 py-3"
                          disabled={salvandoVenda}
                        >
                          Voltar
                        </button>
                        <button
                          onClick={finalizarVenda}
                          disabled={
                            salvandoVenda || 
                            (!usarPagamentoDuplo && !formaPagamento) ||
                            !podeFinalizarFiado ||
                            !pagamentoDuploValido ||
                            (formaPagamento === 'dinheiro' && valorRecebido < total)
                          }
                          className="btn-success flex-1 py-3 text-base md:text-lg"
                        >
                          {salvandoVenda ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5 mr-2" />
                              Finalizar
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
