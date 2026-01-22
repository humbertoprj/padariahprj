import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  codigoBarras: z.string().max(50).optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  custo: z.coerce.number().min(0, 'Custo deve ser positivo'),
  preco: z.coerce.number().min(0, 'Preço deve ser positivo'),
  estoqueAtual: z.coerce.number().min(0),
  estoqueMinimo: z.coerce.number().min(0),
  fabricado: z.boolean().default(false),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  defaultValues?: Partial<ProdutoFormData>;
  onSubmit: (data: ProdutoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categorias = ['Bebidas', 'Padaria', 'Mercearia', 'Laticínios', 'Higiene', 'Limpeza', 'Outros'];
const unidades = ['UN', 'KG', 'L', 'M', 'CX', 'PCT'];

export function ProdutoForm({ defaultValues, onSubmit, onCancel, isLoading }: ProdutoFormProps) {
  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      codigoBarras: '',
      categoria: '',
      unidade: 'UN',
      custo: 0,
      preco: 0,
      estoqueAtual: 0,
      estoqueMinimo: 0,
      fabricado: false,
      ...defaultValues,
    },
  });

  const custo = form.watch('custo');
  const preco = form.watch('preco');
  const margem = custo > 0 ? ((preco - custo) / custo) * 100 : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Coca-Cola 2L" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codigoBarras"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Barras</FormLabel>
                <FormControl>
                  <Input placeholder="7894900011517" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidades.map((un) => (
                      <SelectItem key={un} value={un}>{un}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className={`text-lg font-bold ${margem >= 50 ? 'text-success' : margem >= 30 ? 'text-warning' : 'text-destructive'}`}>
                {margem.toFixed(1)}%
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="estoqueAtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Atual</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estoqueMinimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fabricado"
            render={({ field }) => (
              <FormItem className="col-span-2 flex items-center gap-3 space-y-0 rounded-lg border border-border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div>
                  <FormLabel className="cursor-pointer">Produto Fabricado</FormLabel>
                  <p className="text-xs text-muted-foreground">Marque se este produto é produzido internamente</p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
