/**
 * Parser de Código de Barras de Balança (EAN-13)
 * 
 * Códigos de balança começam com '2' e seguem o padrão:
 * 2CCCCPPPPPV onde:
 * - 2: Prefixo de balança
 * - CCCC: Código do produto (4 dígitos)
 * - PPPPP: Preço/Peso (5 dígitos, em centavos ou gramas)
 * - V: Dígito verificador
 * 
 * Existem dois padrões comuns:
 * - Preço: 2CCCCPPPPPV (5 dígitos = valor em centavos)
 * - Peso: 2CCCCCPPPPPV (código de 5 dígitos + peso de 5 dígitos)
 */

export interface ParsedBarcode {
  tipo: 'balanca_preco' | 'balanca_peso' | 'produto' | 'invalido';
  codigoProduto: string;
  valor?: number; // Preço em reais (se tipo = balanca_preco)
  peso?: number;  // Peso em kg (se tipo = balanca_peso)
  codigoOriginal: string;
}

/**
 * Verifica se o código é de balança (começa com 2)
 */
export function isCodigoBalanca(codigo: string): boolean {
  return codigo.startsWith('2') && codigo.length === 13;
}

/**
 * Extrai o código do produto e o valor/peso de um código de balança EAN-13
 * 
 * Padrão 1 (mais comum - por preço):
 * 2 + CCCC (4 dígitos código) + PPPPP (5 dígitos preço em centavos) + V (verificador)
 * Exemplo: 2123400150001 = Produto 1234, R$ 15,00
 * 
 * Padrão 2 (por peso):
 * 2 + CCCCC (5 dígitos código) + PPPP (4 dígitos peso em gramas) + VV (verificadores)
 */
export function parseCodigoBalanca(codigo: string): ParsedBarcode {
  // Validação básica
  if (!codigo || codigo.length < 12) {
    return {
      tipo: 'invalido',
      codigoProduto: '',
      codigoOriginal: codigo,
    };
  }

  // Remove espaços e caracteres inválidos
  const codigoLimpo = codigo.replace(/\s/g, '');

  // Se não começa com 2, é um código de produto normal
  if (!codigoLimpo.startsWith('2')) {
    return {
      tipo: 'produto',
      codigoProduto: codigoLimpo,
      codigoOriginal: codigo,
    };
  }

  // EAN-13 de balança
  if (codigoLimpo.length === 13) {
    // Padrão por PREÇO: 2 + CCCC + PPPPP + V
    // Código do produto: posições 1-4 (índices 1-5)
    // Preço em centavos: posições 5-9 (índices 5-10)
    const codigoProduto = codigoLimpo.substring(1, 5); // 4 dígitos
    const valorCentavos = parseInt(codigoLimpo.substring(5, 10), 10); // 5 dígitos
    const valorReais = valorCentavos / 100;

    return {
      tipo: 'balanca_preco',
      codigoProduto,
      valor: valorReais,
      codigoOriginal: codigo,
    };
  }

  // EAN-12 (UPC) de balança
  if (codigoLimpo.length === 12 && codigoLimpo.startsWith('2')) {
    const codigoProduto = codigoLimpo.substring(1, 5);
    const valorCentavos = parseInt(codigoLimpo.substring(5, 10), 10);
    const valorReais = valorCentavos / 100;

    return {
      tipo: 'balanca_preco',
      codigoProduto,
      valor: valorReais,
      codigoOriginal: codigo,
    };
  }

  // Código não reconhecido
  return {
    tipo: 'produto',
    codigoProduto: codigoLimpo,
    codigoOriginal: codigo,
  };
}

/**
 * Busca um produto pelo código extraído da balança
 * Tenta encontrar pelo código exato ou pelo código sem zeros à esquerda
 */
export function encontrarProdutoPorCodigoBalanca<T extends { codigoBarras?: string; codigo_barras?: string; id: string }>(
  produtos: T[],
  codigoProduto: string
): T | undefined {
  // Remover zeros à esquerda para comparação
  const codigoSemZeros = codigoProduto.replace(/^0+/, '');
  
  return produtos.find(p => {
    const codigo = p.codigoBarras || p.codigo_barras || '';
    // Comparar código exato
    if (codigo === codigoProduto) return true;
    // Comparar sem zeros à esquerda
    if (codigo.replace(/^0+/, '') === codigoSemZeros) return true;
    // Comparar se o código do produto contém o código da balança
    if (codigo.includes(codigoProduto)) return true;
    return false;
  });
}

/**
 * Formata o peso para exibição
 */
export function formatarPeso(pesoKg: number): string {
  if (pesoKg < 1) {
    return `${(pesoKg * 1000).toFixed(0)}g`;
  }
  return `${pesoKg.toFixed(3)}kg`;
}

/**
 * Formata o valor para exibição
 */
export function formatarValor(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}
