import { useEffect, useMemo, useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFarmStore } from '@/hooks/use-farm-store'

interface Props {
  value: string
  onChange: (value: string) => void
  label?: string
  storageKey: string
  suggestions: string[]
  placeholder?: string
}

/**
 * Campo de categoria pesquisável.
 * - Lista sugestões padrão + categorias já criadas pela organização (persistidas em localStorage por storageKey).
 * - Permite digitar texto livre; se não existir, mostra "+ Criar categoria".
 * - Categorias criadas ficam disponíveis nos próximos lançamentos do mesmo storageKey.
 */
export function CategorySelect({
  value,
  onChange,
  label = 'Categoria',
  storageKey,
  suggestions,
  placeholder = 'Selecione ou digite...',
}: Props) {
  const { structures, expenses, inventory, assets } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Persisted custom categories per storageKey (scoped to this browser/org)
  const STORAGE_PREFIX = 'sonho_roceiro_categories_'
  const fullKey = STORAGE_PREFIX + storageKey

  const [customCats, setCustomCats] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    setCustomCats(() => {
      try {
        const raw = localStorage.getItem(fullKey)
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    })
  }, [fullKey])

  // Existing categories in use across the org for this domain
  const usedCats = useMemo(() => {
    const source = (() => {
      switch (storageKey) {
        case 'structure':
          return structures
        case 'expense':
          return expenses
        case 'inventory':
          return inventory
        case 'asset':
          return assets
        default:
          return []
      }
    })() as Array<{ category?: string }>
    const set = new Set<string>()
    source.forEach((s) => {
      if (s.category) set.add(s.category)
    })
    return Array.from(set)
  }, [storageKey, structures, expenses, inventory, assets])

  const allOptions = useMemo(() => {
    const merged = new Set<string>([...suggestions, ...customCats, ...usedCats])
    return Array.from(merged)
  }, [suggestions, customCats, usedCats])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((c) => c.toLowerCase().includes(q))
  }, [allOptions, query])

  const exactMatch = allOptions.some((c) => c.toLowerCase() === query.trim().toLowerCase())
  const canCreate = query.trim().length > 0 && !exactMatch

  const createCategory = () => {
    const name = query.trim()
    if (!name) return
    const next = Array.from(new Set([...customCats, name]))
    setCustomCats(next)
    try {
      localStorage.setItem(fullKey, JSON.stringify(next))
    } catch {
      // ignore
    }
    onChange(name)
    setQuery('')
    setOpen(false)
  }

  const selectCategory = (c: string) => {
    onChange(c)
    setQuery('')
    setOpen(false)
  }

  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-xs rounded-xl justify-between font-normal"
          >
            <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
              {value || placeholder}
            </span>
            <Plus className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
          <Input
            autoFocus
            placeholder="Buscar ou criar categoria..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 text-xs rounded-lg mb-2"
          />
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {filtered.length === 0 && !canCreate && (
              <p className="text-[11px] text-muted-foreground text-center py-3">
                Nenhuma categoria encontrada.
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCategory(c)}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg hover:bg-secondary flex items-center justify-between"
              >
                <span>{c}</span>
                {value === c && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={createCategory}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg hover:bg-primary/10 text-primary font-semibold flex items-center gap-1.5 border-t border-border mt-1 pt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Criar categoria "{query.trim()}"
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
