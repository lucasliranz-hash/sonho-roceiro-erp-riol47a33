import { MoreVertical, Pencil, Trash2, Eye, ArrowRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Props {
  /** Abrir detalhes do registro */
  onView?: () => void
  /** Abrir formulário de edição */
  onEdit?: () => void
  /** Abrir confirmação de exclusão */
  onDelete?: () => void
  /** Alias de onView (mantém compatibilidade com chamadas existentes) */
  onViewDetails?: () => void
  /** Abrir entidade de origem (registros automáticos) */
  onViewOrigin?: () => void
  /** Itens extras de menu específicos do módulo (ex: Ovoscopia, Finalizar) */
  extraItems?: { label: string; icon?: any; onClick: () => void; disabled?: boolean }[]
  /** "MANUAL" ou outro valor — se não MANUAL, oculta Editar/Excluir direto */
  sourceType?: string
  /** ID do registro de origem (registros automáticos) */
  sourceId?: string
  /** Texto descritivo da origem (ex: "Venda #123") */
  sourceLabel?: string
  /** Usuário sem permissão de edição/exclusão */
  disabled?: boolean
}

export function RecordActionMenu({
  onView,
  onEdit,
  onDelete,
  onViewDetails,
  onViewOrigin,
  extraItems,
  sourceType,
  sourceId,
  sourceLabel,
  disabled,
}: Props) {
  const view = onView || onViewDetails
  const isManual = !sourceType || sourceType === 'MANUAL'
  const canEdit = !disabled && isManual && !!onEdit
  const canDelete = !disabled && isManual && !!onDelete

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg shrink-0 touch-target"
            aria-label="Ações do registro"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          {view && (
            <DropdownMenuItem onClick={view} className="text-xs cursor-pointer h-10">
              <Eye className="w-3.5 h-3.5 mr-2" /> Ver detalhes
            </DropdownMenuItem>
          )}
          {onViewOrigin && (
            <DropdownMenuItem onClick={onViewOrigin} className="text-xs cursor-pointer h-10">
              <ArrowRight className="w-3.5 h-3.5 mr-2" /> Ver origem
              {sourceLabel && <span className="ml-1 text-muted-foreground">({sourceLabel})</span>}
            </DropdownMenuItem>
          )}
          {extraItems?.map((item) => {
            const Icon = item.icon
            return (
              <DropdownMenuItem
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className="text-xs cursor-pointer h-10"
              >
                {Icon && <Icon className="w-3.5 h-3.5 mr-2" />} {item.label}
              </DropdownMenuItem>
            )
          })}
          {canEdit && (
            <DropdownMenuItem onClick={onEdit!} className="text-xs cursor-pointer h-10">
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={onDelete!}
              className="text-xs cursor-pointer h-10 text-rose-600 focus:text-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          )}
          {!canEdit &&
            !canDelete &&
            !view &&
            !onViewOrigin &&
            (!extraItems || extraItems.length === 0) && (
              <DropdownMenuItem disabled className="text-xs">
                Sem ações disponíveis
              </DropdownMenuItem>
            )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
