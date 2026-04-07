import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Database } from '@/lib/supabase/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UploadCloud, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Profile = Database['public']['Tables']['profiles']['Row'] & { avatar?: string | null }

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['Admin', 'Gerente', 'Vendedor']),
})

interface EditUserDialogProps {
  user: Profile | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: z.infer<typeof formSchema>, file: File | null) => Promise<void>
}

export function EditUserDialog({ user, isOpen, onOpenChange, onSave }: EditUserDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', role: 'Vendedor' },
  })

  useEffect(() => {
    if (user && isOpen) {
      form.reset({ name: user.name || '', email: user.email || '', role: user.role })
      setFile(null)
      setPreview(user.avatar || null)
    }
  }, [user, isOpen, form])

  const handleDrag = useCallback((e: React.DragEvent, dragging: boolean) => {
    e.preventDefault()
    setIsDragging(dragging)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type.startsWith('image/')) {
      setFile(droppedFile)
      setPreview(URL.createObjectURL(droppedFile))
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await onSave(values, file)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário e sua foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Foto de Perfil</FormLabel>
              <div
                onDragOver={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                  preview ? 'p-4' : '',
                )}
              >
                {preview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-full">
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    <label
                      htmlFor="photo-upload"
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
                    >
                      Trocar
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="photo-upload"
                    className="flex cursor-pointer flex-col items-center"
                  >
                    <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      Arraste uma imagem ou clique para selecionar
                    </span>
                  </label>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do usuário" {...field} />
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
                    <Input placeholder="email@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Acesso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Administrador</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
