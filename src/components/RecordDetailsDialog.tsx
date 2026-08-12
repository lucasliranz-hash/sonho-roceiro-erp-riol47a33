import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface DetailRow {
  label: string
  value: string | number | undefined | null
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  rows: DetailRow[]
  badge?: { label: string; className?: string } | null
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  return String(v)
}

export function RecordDetailsDialog({ open, onOpenChange, title, rows, badge }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {title}
            {badge && (
              <Badge className={badge.className || 'bg-secondary text-foreground text-[10px]'}>
                {badge.label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          {rows.map((r) => (
            <p key={r.label}>
              <strong className="text-muted-foreground">{r.label}:</strong>{' '}
              <span className="text-foreground">{formatValue(r.value)}</span>
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
