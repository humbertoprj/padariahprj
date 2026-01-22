import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

const ordemSchema = z.object({
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  quantidade: z.coerce.number().min(1, 'Quantidade mínima é 1'),
  dataPrevista: z.string().min(1, 'Data prevista é obrigatória'),
  observacoes: z.string().max(500).optional(),
});

export type OrdemProducaoFormData = z.infer<typeof ordemSchema>;

interface ProdutoFabricado {
  id: string;
  nome: string;
}

interface OrdemProducaoFormProps {
  produtos: ProdutoFabricado[];
  onSubmit: (data: OrdemProducaoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrdemProducaoForm({ produtos, onSubmit, onCancel, isLoading }: OrdemProducaoFormProps) {
  const form = useForm<OrdemProducaoFormData>({
    resolver: zodResolver(ordemSchema),
    defaultValues: {
      produtoId: '',
      quantidade: 1,
      dataPrevista: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="produtoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto a Fabricar</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {produtos.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>{prod.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataPrevista"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Prevista</FormLabel>
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
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Instruções especiais, notas, etc..." 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Ordem'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
