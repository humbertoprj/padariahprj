import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

const contaSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').max(200),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  categoria: z.string().optional(),
});

export type ContaFormData = z.infer<typeof contaSchema>;

interface ContaFormProps {
  tipo: 'receber' | 'pagar';
  onSubmit: (data: ContaFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoriasReceber = ['Vendas', 'Serviços', 'Outros'];
const categoriasPagar = ['Fornecedores', 'Salários', 'Aluguel', 'Energia', 'Água', 'Internet', 'Impostos', 'Outros'];

export function ContaForm({ tipo, onSubmit, onCancel, isLoading }: ContaFormProps) {
  const categorias = tipo === 'receber' ? categoriasReceber : categoriasPagar;

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      dataVencimento: new Date().toISOString().split('T')[0],
      categoria: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tipo === 'receber' ? 'Cliente / Descrição' : 'Fornecedor / Descrição'}</FormLabel>
              <FormControl>
                <Input placeholder={tipo === 'receber' ? 'Nome do cliente' : 'Nome do fornecedor'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataVencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
