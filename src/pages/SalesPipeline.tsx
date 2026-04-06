import { useState } from 'react'
import { PipelineStage, Opportunity } from '@/lib/types'
import { mockOpportunities } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STAGES: PipelineStage[] = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado/Ganho',
  'Fechado/Perdido',
]

export default function SalesPipeline() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('opportunityId', id)
    // Optional styling while dragging could go here
  }

  const handleDragOver = (e: React.DragEvent) => {
    // Prevent default to allow drop
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('opportunityId')

    if (id) {
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, stage: targetStage } : op)),
      )
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const columnOps = opportunities.filter((op) => op.stage === stage)
          const totalValue = columnOps.reduce((sum, op) => sum + op.estimatedValue, 0)

          return (
            <div
              key={stage}
              className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-muted/50 p-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{stage}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnOps.length}
                </Badge>
              </div>
              <div className="mb-3 px-1 text-xs font-medium text-muted-foreground">
                {formatCurrency(totalValue)}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {columnOps.map((op) => (
                  <Card
                    key={op.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, op.id)}
                    className="cursor-grab transition-colors hover:border-primary/50 active:cursor-grabbing"
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-medium leading-none">{op.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 p-3 pt-0">
                      <div className="text-xs text-muted-foreground">{op.customerName}</div>
                      <div className="text-sm font-bold text-primary">
                        {formatCurrency(op.estimatedValue)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
