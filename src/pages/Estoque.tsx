import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { NovoItemDialog } from '@/components/estoque/NovoItemDialog'
import { StockMovementDialog } from '@/components/estoque/StockMovementDialog'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDown,
  ArrowUp,
  Syringe,
  Pill,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { InventoryItem } from '@/types/farm'

const SANITARY_CATEGORIES = [
  'Vacinas',
  'Medicamentos',
  'Suplementos',
  'Vermífugos',
  'Outros produtos sanitários',
]

export default function Estoque() {
  const { inventory, deleteInventory, stockMovements, deleteStockMovement } = useFarmStore()
  const { canEdit, canDelete } = usePermissions()

  const [tab, setTab] = useState<'itens' | 'movimentacoes'>('itens')
  const [novoOpen, setNovoOpen] = useState(false)
  const [entradaOpen, setEntradaOpen] = useState(false)
  const [saidaOpen, setSaidaOpen] = useState(false)

  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)
  const [details, setDetails] = useState<InventoryItem | null>(null)
  const [deletingMov, setDeletingMov] = useState<any | null>(null)
  const [detailsMov, setDetailsMov] = useState<any | null>(null)

  const handleDeleteMov = async () => {
    if (!deletingMov) return
    const { error } = await deleteStockMovement(deletingMov.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_stock_movements', deletingMov.id, deletingMov as any, null)
    toast({ title: 'Movimentação excluída! 🗑️', description: 'Saldo recalculado.' })
    setDeletingMov(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteInventory(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_inventory', deleting.id, deleting as any, null)
    toast({ title: 'Item excluído! 🗑️' })
    setDeleting(null)
  }

  const getExpirationStatus = (item: InventoryItem) => {
    if (!item.expiration_date) return null
    const exp = new Date(item.expiration_date)
    const now = new Date()
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: 'Vencido',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
      }
    }
    if (diffDays <= 30) {
      return {
        status: 'warning',
        label: `Vence em ${diffDays}d`,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      }
    }
    return {
      status: 'ok',
      label: 'Validade OK',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Estoque de Insumos, Vacinas e Ração
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhamento de frascos sanitários, dosagens, ração e insumos com rastreabilidade de
          lotes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setEditing(null)
            setNovoOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Item / Vacina
        </Button>
        <Button
          onClick={() => setEntradaOpen(true)}
          variant="outline"
          className="rounded-xl text-xs gap-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800"
        >
          <ArrowDown className="w-4 h-4 text-emerald-600" /> Registrar Entrada
        </Button>
        <Button
          onClick={() => setSaidaOpen(true)}
          variant="outline"
          className="rounded-xl text-xs gap-2 border-rose-300 hover:bg-rose-50 text-rose-800"
        >
          <ArrowUp className="w-4 h-4 text-rose-600" /> Registrar Saída
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === 'itens' ? 'default' : 'outline'}
          onClick={() => setTab('itens')}
          className="rounded-xl text-xs"
        >
          Itens ({inventory.length})
        </Button>
        <Button
          variant={tab === 'movimentacoes' ? 'default' : 'outline'}
          onClick={() => setTab('movimentacoes')}
          className="rounded-xl text-xs"
        >
          Movimentações ({stockMovements.length})
        </Button>
      </div>

      {tab === 'itens' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventory.length === 0 && (
            <Card className="rounded-3xl bg-white border-border shadow-subtle col-span-full">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhum item cadastrado
                </p>
              </CardContent>
            </Card>
          )}
          {inventory.map((item) => {
            const isSanitary = SANITARY_CATEGORIES.includes(item.category)
            const isLow = (item.currentStock || 0) <= (item.minStock || 0)
            const expStatus = getExpirationStatus(item)
            const isExpired = expStatus?.status === 'expired'

            return (
              <Card
                key={item.id}
                className={`rounded-3xl bg-white border-border shadow-subtle p-5 transition-all ${
                  isExpired
                    ? 'border-rose-300 bg-rose-50/20'
                    : isLow
                      ? 'border-amber-300 bg-amber-50/20'
                      : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {isSanitary ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 gap-1"
                      >
                        <Syringe className="w-3 h-3" /> {item.category}
                      </Badge>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {expStatus && (
                      <Badge className={`text-[10px] gap-1 border ${expStatus.color}`}>
                        {expStatus.status === 'expired' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {expStatus.label}
                      </Badge>
                    )}

                    {isLow ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" /> Baixo
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Normal</Badge>
                    )}

                    <RecordActionMenu
                      onView={() => setDetails(item)}
                      onEdit={
                        canEdit
                          ? () => {
                              setEditing(item)
                              setNovoOpen(true)
                            }
                          : undefined
                      }
                      onDelete={canDelete ? () => setDeleting(item) : undefined}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  {item.name}
                </h3>

                {/* Detalhes sanitários de embalagem / lote */}
                {isSanitary && (
                  <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
                    {item.packaging_type && (
                      <p>
                        Embalagem:{' '}
                        <strong className="text-foreground">{item.packaging_type}</strong>{' '}
                        {item.content_per_package
                          ? `(${item.content_per_package} ${item.unit}/${item.packaging_type.toLowerCase()})`
                          : ''}
                      </p>
                    )}
                    {item.manufacturer_batch && (
                      <p>
                        Lote Fabricante:{' '}
                        <strong className="text-foreground">{item.manufacturer_batch}</strong>
                      </p>
                    )}
                    {item.expiration_date && (
                      <p>
                        Validade:{' '}
                        <strong className="text-foreground">{item.expiration_date}</strong>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Saldo em Estoque
                    </span>
                    <span className="text-xl font-extrabold text-foreground">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      Custo Unitário Médio
                    </span>
                    <span className="text-sm font-bold text-primary">
                      R$ {(item.averageCost || 0).toFixed(2)}/{item.unit || 'un'}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'movimentacoes' && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Histórico de Movimentações</h2>
          <div className="space-y-2">
            {stockMovements.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma movimentação registrada.
              </p>
            )}
            {stockMovements.map((m: any) => {
              const isEntrada = m.type === 'entrada'
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {m.inventoryItemName || 'Item'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.date} • {m.movementType} •{' '}
                      {isEntrada ? (
                        <span className="text-emerald-700 font-semibold">+{m.quantity}</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">−{m.quantity}</span>
                      )}{' '}
                      {m.unit}
                      {m.package_quantity ? ` (${m.package_quantity} emb.)` : ''}
                      {m.manufacturer_batch ? ` • Lote: ${m.manufacturer_batch}` : ''}
                      {m.expiration_date ? ` • Val: ${m.expiration_date}` : ''}
                      {m.notes ? ` • ${m.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-primary">Saldo: {m.balanceAfter}</p>
                      <p className="text-[10px] text-muted-foreground">
                        R$ {(m.totalValue || 0).toFixed(2)}
                      </p>
                    </div>
                    <RecordActionMenu
                      onView={() => setDetailsMov(m)}
                      onDelete={canDelete ? () => setDeletingMov(m) : undefined}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Diálogos */}
      <NovoItemDialog
        open={novoOpen}
        onOpenChange={(v) => {
          setNovoOpen(v)
          if (!v) setEditing(null)
        }}
        editingItem={editing}
      />
      <StockMovementDialog open={entradaOpen} onOpenChange={setEntradaOpen} type="entrada" />
      <StockMovementDialog open={saidaOpen} onOpenChange={setSaidaOpen} type="saida" />

      <DeleteConfirmDialog
        open={!!deletingMov}
        onOpenChange={(v) => !v && setDeletingMov(null)}
        onConfirm={handleDeleteMov}
      />

      <RecordDetailsDialog
        open={!!detailsMov}
        onOpenChange={(v) => !v && setDetailsMov(null)}
        title={`Movimentação — ${detailsMov?.inventoryItemName || ''}`}
        badge={
          detailsMov
            ? {
                label: detailsMov.type === 'entrada' ? 'Entrada' : 'Saída',
                className:
                  detailsMov.type === 'entrada'
                    ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                    : 'bg-rose-100 text-rose-800 text-[10px]',
              }
            : null
        }
        rows={
          detailsMov
            ? [
                { label: 'Item', value: detailsMov.inventoryItemName },
                { label: 'Data', value: detailsMov.date },
                { label: 'Tipo', value: detailsMov.movementType },
                { label: 'Direção', value: detailsMov.type === 'entrada' ? 'Entrada' : 'Saída' },
                { label: 'Quantidade', value: `${detailsMov.quantity} ${detailsMov.unit}` },
                { label: 'Qtd Embalagens', value: detailsMov.package_quantity || '—' },
                {
                  label: 'Valor / Embalagem',
                  value: detailsMov.value_per_package ? `R$ ${detailsMov.value_per_package}` : '—',
                },
                { label: 'Lote Fabricante', value: detailsMov.manufacturer_batch || '—' },
                { label: 'Validade', value: detailsMov.expiration_date || '—' },
                { label: 'Saldo após', value: detailsMov.balanceAfter },
                {
                  label: 'Valor total (R$)',
                  value: detailsMov.totalValue ? `R$ ${detailsMov.totalValue.toFixed(2)}` : '—',
                },
                { label: 'Fornecedor', value: detailsMov.supplier || '—' },
                { label: 'Documento / NF', value: detailsMov.documentNumber || '—' },
                { label: 'Observação', value: detailsMov.notes || '—' },
              ]
            : []
        }
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Estoque — ${details?.name || ''}`}
        badge={
          details
            ? details.currentStock <= details.minStock
              ? { label: 'Baixo', className: 'bg-amber-100 text-amber-800 text-[10px]' }
              : { label: 'Normal', className: 'bg-emerald-100 text-emerald-800 text-[10px]' }
            : null
        }
        rows={
          details
            ? [
                { label: 'Nome', value: details.name },
                { label: 'Categoria', value: details.category },
                { label: 'Unidade de Consumo', value: details.unit },
                { label: 'Tipo de Embalagem', value: details.packaging_type || '—' },
                {
                  label: 'Conteúdo por Embalagem',
                  value: details.content_per_package
                    ? `${details.content_per_package} ${details.unit}`
                    : '—',
                },
                { label: 'Estoque atual', value: `${details.currentStock} ${details.unit}` },
                { label: 'Estoque mínimo', value: `${details.minStock} ${details.unit}` },
                {
                  label: 'Custo médio unitário (R$)',
                  value: `R$ ${(details.averageCost || 0).toFixed(4)} / ${details.unit}`,
                },
                { label: 'Lote Fabricante', value: details.manufacturer_batch || '—' },
                { label: 'Data de Fabricação', value: details.manufacturing_date || '—' },
                { label: 'Validade', value: details.expiration_date || '—' },
                { label: 'Fornecedor', value: details.supplier || '—' },
                { label: 'Marca / Fabricante', value: details.brand || '—' },
                { label: 'Última atualização', value: details.lastUpdated || '—' },
                { label: 'Observação', value: details.notes || '—' },
              ]
            : []
        }
      />
    </div>
  )
}
