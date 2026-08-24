import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { PipelineReport } from '@/components/reports/PipelineReport'
import { PerformanceReport } from '@/components/reports/PerformanceReport'
import { CustomersReport } from '@/components/reports/CustomersReport'
import { OperationalReport } from '@/components/reports/OperationalReport'
import { useAuth } from '@/hooks/use-auth'
import { fetchProfiles } from '@/services/reports/shared'

export default function Reports() {
  const { profile, user } = useAuth()
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [selectedSeller, setSelectedSeller] = useState('all')
  const [sellers, setSellers] = useState<{ id: string; name: string | null }[]>([])

  const showSellerFilter = profile?.role !== 'Vendedor'

  useEffect(() => {
    fetchProfiles().then(setSellers).catch(console.error)
  }, [])

  const effectiveUserId = showSellerFilter
    ? selectedSeller === 'all'
      ? undefined
      : selectedSeller
    : user?.id

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analise dados de vendas, performance, clientes e operação.
        </p>
      </div>

      <ReportFilters
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
        showSellerFilter={showSellerFilter}
        sellers={sellers}
        selectedSeller={selectedSeller}
        onSellerChange={setSelectedSeller}
      />

      <Tabs defaultValue="pipeline">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="pipeline">Pipeline e Vendas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-6">
          <PipelineReport
            dateStart={dateStart || undefined}
            dateEnd={dateEnd || undefined}
            userId={effectiveUserId}
          />
        </TabsContent>
        <TabsContent value="performance" className="mt-6">
          <PerformanceReport
            dateStart={dateStart || undefined}
            dateEnd={dateEnd || undefined}
            userId={effectiveUserId}
          />
        </TabsContent>
        <TabsContent value="clientes" className="mt-6">
          <CustomersReport
            dateStart={dateStart || undefined}
            dateEnd={dateEnd || undefined}
            userId={effectiveUserId}
          />
        </TabsContent>
        <TabsContent value="operacional" className="mt-6">
          <OperationalReport
            dateStart={dateStart || undefined}
            dateEnd={dateEnd || undefined}
            userId={effectiveUserId}
            sellers={sellers}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
