import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CategorySelect } from '@/components/CategorySelect'
import { useFarmStore } from '@/hooks/use-farm-store'
import { toast } from '@/hooks/use-toast'

export interface FormField {
  key: string
  label: string
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'category-select'
    | 'aplicacao'
  required?: boolean
  options?: string[]
  placeholder?: string
  defaultValue?: string
  step?: string
  /** storageKey for category-select (structure/expense/inventory/asset) */
  categoryStorageKey?: string
  showWhen?: (values: Record<string, string>) => boolean
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  fields: FormField[]
  onSubmit: (values: Record<string, string>) => Promise<void>
  submitLabel?: string
  lotConfig?: { required: boolean; showWhen?: (values: Record<string, string>) => boolean }
  initialValues?: Record<string, string>
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = 'Salvar',
  lotConfig,
  initialValues,
}: Props) {
  const { lots } = useFarmStore()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = { lotId: initialValues?.lotId || '' }
      fields.forEach((f) => {
        init[f.key] =
          initialValues?.[f.key] ||
          f.defaultValue ||
          (f.type === 'date' ? new Date().toISOString().split('T')[0] : '')
      })
      setValues(init)
    }
  }, [open, initialValues])

  const visibleFields = fields.filter((f) => !f.showWhen || f.showWhen(values))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lotConfig?.required && !values.lotId) {
      toast({ title: 'Selecione um lote', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {visibleFields.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">
                {f.label}
                {f.required ? ' *' : ''}
              </Label>
              {f.type === 'category-select' ? (
                <CategorySelect
                  value={values[f.key] || ''}
                  onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                  label=""
                  storageKey={f.categoryStorageKey || 'expense'}
                  suggestions={f.options || []}
                />
              ) : f.type === 'aplicacao' ? (
                <Select
                  value={values[f.key] || 'propriedade'}
                  onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propriedade" className="text-xs">
                      Propriedade (sem lote)
                    </SelectItem>
                    <SelectItem value="atividade" className="text-xs">
                      Atividade
                    </SelectItem>
                    <SelectItem value="lote" className="text-xs">
                      Lote
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : f.type === 'select' ? (
                <Select
                  value={values[f.key] || ''}
                  onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder={f.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === 'textarea' ? (
                <Textarea
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="text-xs rounded-xl"
                  placeholder={f.placeholder}
                />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values[f.key] === 'true'}
                    onChange={(e) =>
                      setValues((p) => ({ ...p, [f.key]: e.target.checked.toString() }))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs">{f.placeholder}</span>
                </label>
              ) : (
                <Input
                  type={f.type}
                  step={f.step}
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-10 text-xs rounded-xl"
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </div>
          ))}
          {lotConfig && (!lotConfig.showWhen || lotConfig.showWhen(values)) && (
            <div>
              <Label className="text-xs">Lote{lotConfig.required ? ' *' : ' (opcional)'}</Label>
              <Select
                value={values.lotId || ''}
                onValueChange={(v) => setValues((p) => ({ ...p, lotId: v }))}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
          >
            {saving ? 'Salvando...' : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
