import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Customer } from '@/lib/types'

const customerSchema = z
  .object({
    customerType: z.enum(['B2B', 'B2C']),
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Insira um e-mail válido'),
    phone: z.string().min(10, 'Insira um telefone válido'),
    company: z.string().optional(),
    document: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.customerType === 'B2B' && (!data.company || data.company.trim().length < 2)) {
        return false
      }
      return true
    },
    {
      message: 'O nome da empresa é obrigatório para clientes B2B',
      path: ['company'],
    },
  )

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  onSubmit: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void> | void
  onCancel: () => void
}

export function CustomerForm({ onSubmit, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: 'B2C',
      name: '',
      email: '',
      phone: '',
      company: '',
      document: '',
    },
  })

  const customerType = form.watch('customerType')

  const handleSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: values.name,
        email: values.email,
        phone: values.phone,
        customerType: values.customerType,
        company: values.customerType === 'B2B' ? values.company || null : null,
        document: values.document || null,
        status: 'Lead',
        avatar: `https://img.usecurling.com/ppl/thumbnail?seed=${Math.floor(Math.random() * 1000)}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-6 animate-fade-in">
        <FormField
          control={form.control}
          name="customerType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Cliente</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row gap-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="B2C" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Pessoa Física (B2C)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="B2B" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Pessoa Jurídica (B2B)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="joao@exemplo.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{customerType === 'B2B' ? 'CNPJ' : 'CPF'}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={customerType === 'B2B' ? '00.000.000/0001-00' : '000.000.000-00'}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {customerType === 'B2B' && (
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="animate-fade-in-up">
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da empresa" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Cliente'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
