import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, User, Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'
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
    phone: z.string().min(10, 'Insira um telefone válido').or(z.string().length(0)),
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
  initialData?: Customer | null
  onSubmit: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void> | void
  onCancel: () => void
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: initialData?.customerType || 'B2C',
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      document: initialData?.document || '',
    },
  })

  // Update default values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        customerType: initialData.customerType || 'B2C',
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        document: initialData.document || '',
      })
    }
  }, [initialData, form])

  const customerType = form.watch('customerType')

  const handleSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        customerType: values.customerType,
        company: values.customerType === 'B2B' ? values.company || null : null,
        document: values.document || null,
        status: initialData?.status || 'Lead',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5 mt-6 animate-fade-in pb-8"
      >
        <FormField
          control={form.control}
          name="customerType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Cliente</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full"
                >
                  <FormItem className="w-full space-y-0">
                    <FormControl>
                      <RadioGroupItem
                        value="B2C"
                        className="peer sr-only"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel
                      className={cn(
                        'flex w-full items-center justify-center gap-2 px-4 py-3 rounded-[6px] text-[14px] font-medium transition-all duration-200 ease-in-out cursor-pointer',
                        'peer-focus-visible:ring-2 peer-focus-visible:ring-[#0070D2] peer-focus-visible:ring-offset-2',
                        isSubmitting
                          ? 'bg-[#F8F9FA] border border-[#E0E0E0] text-[#CCCCCC] opacity-50 cursor-not-allowed pointer-events-none'
                          : field.value === 'B2C'
                            ? 'bg-[#F0E8FF] border-2 border-[#7B3FF2] text-[#7B3FF2] hover:bg-[#F0E8FF] hover:shadow-[0_2px_6px_rgba(123,63,242,0.15)]'
                            : 'bg-[#F0F2F5] border border-[#D3D3D3] text-[#666666] hover:bg-[#E8E8E8]',
                      )}
                      aria-pressed={field.value === 'B2C'}
                      aria-label="Classificar como B2C"
                    >
                      <User
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isSubmitting
                            ? 'text-[#CCCCCC]'
                            : field.value === 'B2C'
                              ? 'text-[#7B3FF2]'
                              : 'text-[#999999]',
                        )}
                      />
                      Pessoa Física (B2C)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="w-full space-y-0">
                    <FormControl>
                      <RadioGroupItem
                        value="B2B"
                        className="peer sr-only"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel
                      className={cn(
                        'flex w-full items-center justify-center gap-2 px-4 py-3 rounded-[6px] text-[14px] font-medium transition-all duration-200 ease-in-out cursor-pointer',
                        'peer-focus-visible:ring-2 peer-focus-visible:ring-[#0070D2] peer-focus-visible:ring-offset-2',
                        isSubmitting
                          ? 'bg-[#F8F9FA] border border-[#E0E0E0] text-[#CCCCCC] opacity-50 cursor-not-allowed pointer-events-none'
                          : field.value === 'B2B'
                            ? 'bg-[#E8F0FF] border-2 border-[#0070D2] text-[#0070D2] hover:bg-[#E8F0FF] hover:shadow-[0_2px_6px_rgba(0,112,210,0.15)]'
                            : 'bg-[#F0F2F5] border border-[#D3D3D3] text-[#666666] hover:bg-[#E8E8E8]',
                      )}
                      aria-pressed={field.value === 'B2B'}
                      aria-label="Classificar como B2B"
                    >
                      <Building2
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isSubmitting
                            ? 'text-[#CCCCCC]'
                            : field.value === 'B2B'
                              ? 'text-[#0070D2]'
                              : 'text-[#999999]',
                        )}
                      />
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
            ) : initialData ? (
              'Salvar Alterações'
            ) : (
              'Salvar Cliente'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
