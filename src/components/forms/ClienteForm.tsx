import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  cpfCnpj: z.string().max(18).optional(),
  telefone: z.string().max(15).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().max(200).optional(),
  dataNascimento: z.string().optional(),
  limiteCredito: z.coerce.number().min(0).default(0),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  defaultValues?: Partial<ClienteFormData>;
  onSubmit: (data: ClienteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClienteForm({ defaultValues, onSubmit, onCancel, isLoading }: ClienteFormProps) {
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      cpfCnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      dataNascimento: '',
      limiteCredito: 0,
      ...defaultValues,
    },
  });

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: João da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpfCnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="000.000.000-00" 
                    maxLength={18}
                    {...field}
                    onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(11) 99999-9999" 
                    maxLength={15}
                    {...field}
                    onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, bairro, cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="limiteCredito"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de Crédito (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
