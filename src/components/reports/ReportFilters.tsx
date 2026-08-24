import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReportFiltersProps {
  dateStart: string
  dateEnd: string
  onDateStartChange: (v: string) => void
  onDateEndChange: (v: string) => void
  showSellerFilter: boolean
  sellers: { id: string; name: string | null }[]
  selectedSeller: string
  onSellerChange: (v: string) => void
}

export function ReportFilters({
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
  showSellerFilter,
  sellers,
  selectedSeller,
  onSellerChange,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/50 p-4 rounded-lg">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Data inicial</Label>
        <Input
          type="date"
          value={dateStart}
          onChange={(e) => onDateStartChange(e.target.value)}
          className="w-full sm:w-40 bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Data final</Label>
        <Input
          type="date"
          value={dateEnd}
          onChange={(e) => onDateEndChange(e.target.value)}
          className="w-full sm:w-40 bg-white"
        />
      </div>
      {showSellerFilter && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Vendedor</Label>
          <Select value={selectedSeller} onValueChange={onSellerChange}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {sellers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name || 'Sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
