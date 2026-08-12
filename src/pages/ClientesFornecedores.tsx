import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { Users, Phone, Plus } from 'lucide-react'
import { Customer, Supplier } from '@/types/farm'

export default function ClientesFornecedores() {
  const {
    customers,
    suppliers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useFarmStore()

  const [custOpen, setCustOpen] = useState(false)
  const [supOpen, setSupOpen] = useState(false)
  const [editingCust, setEditingCust] = useState<Customer | null>(null)
  const [editingSup, setEditingSup] = useState<Supplier | null>(null)
  const [deletingCust, setDeletingCust] = useState<Customer | null>(null)
  const [deletingSup, setDeletingSup] = useState<Supplier | null>(null)

  const emptyCust = {
    name: '',
    phone: '',
    whatsapp: '',
    city: '',
    notes: '',
  }
  const emptySup = {
    name: '',
    suppliedProduct: '',
    phone: '',
    city: '',
    notes: '',
  }
  const [custForm, setCustForm] = useState(emptyCust)
  const [supForm, setSupForm] = useState(emptySup)

  const openCustCreate = () => {
    setEditingCust(null)
    setCustForm(emptyCust)
    setCustOpen(true)
  }
  const openCustEdit = (c: Customer) => {
    setEditingCust(c)
    setCustForm({
      name: c.name,
      phone: c.phone,
      whatsapp: c.whatsapp,
      city: c.city,
      notes: c.notes || '',
    })
    setCustOpen(true)
  }
  const openSupCreate = () => {
    setEditingSup(null)
    setSupForm(emptySup)
    setSupOpen(true)
  }
  const openSupEdit = (s: Supplier) => {
    setEditingSup(s)
    setSupForm({
      name: s.name,
      suppliedProduct: s.suppliedProduct,
      phone: s.phone,
      city: s.city,
      notes: s.notes || '',
    })
    setSupOpen(true)
  }

  const handleCustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { ...custForm }
      if (editingCust) {
        const { error } = await updateCustomer(editingCust.id, data)
        if (error) throw new Error(error.message)
        await logAudit('UPDATE', 'farm_customers', editingCust.id, editingCust as any, data as any)
        toast({ title: 'Cliente atualizado! ✅' })
      } else {
        const { error } = await addCustomer({ ...data, id: `cus-${Date.now()}` } as any)
        if (error) throw new Error(error.message)
        toast({ title: 'Cliente cadastrado! ✅' })
      }
      setCustOpen(false)
      setEditingCust(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleSupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { ...supForm }
      if (editingSup) {
        const { error } = await updateSupplier(editingSup.id, data)
        if (error) throw new Error(error.message)
        await logAudit('UPDATE', 'farm_suppliers', editingSup.id, editingSup as any, data as any)
        toast({ title: 'Fornecedor atualizado! ✅' })
      } else {
        const { error } = await addSupplier({ ...data, id: `sup-${Date.now()}` } as any)
        if (error) throw new Error(error.message)
        toast({ title: 'Fornecedor cadastrado! ✅' })
      }
      setSupOpen(false)
      setEditingSup(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDeleteCust = async () => {
    if (!deletingCust) return
    try {
      const { error } = await deleteCustomer(deletingCust.id)
      if (error) throw new Error(error.message)
      await logAudit('DELETE', 'farm_customers', deletingCust.id, deletingCust as any, null)
      toast({ title: 'Cliente excluído! 🗑️' })
      setDeletingCust(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDeleteSup = async () => {
    if (!deletingSup) return
    try {
      const { error } = await deleteSupplier(deletingSup.id)
      if (error) throw new Error(error.message)
      await logAudit('DELETE', 'farm_suppliers', deletingSup.id, deletingSup as any, null)
      toast({ title: 'Fornecedor excluído! 🗑️' })
      setDeletingSup(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Clientes e Fornecedores
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Cadastro de contatos e histórico de negócios da propriedade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 rounded-3xl bg-white border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Clientes Cadastrados</h2>
            <Button onClick={openCustCreate} variant="outline" className="rounded-xl text-xs gap-2">
              <Plus className="w-4 h-4" /> Novo Cliente
            </Button>
          </div>
          {customers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum cliente cadastrado
            </p>
          )}
          {customers.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-2xl bg-secondary/30 text-xs space-y-1 flex items-start justify-between"
            >
              <div>
                <p className="font-bold text-foreground">{c.name}</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {c.phone} • {c.city}
                </p>
              </div>
              <RecordActionMenu
                onEdit={() => openCustEdit(c)}
                onDelete={() => setDeletingCust(c)}
              />
            </div>
          ))}
        </Card>

        <Card className="p-5 rounded-3xl bg-white border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Fornecedores</h2>
            <Button onClick={openSupCreate} variant="outline" className="rounded-xl text-xs gap-2">
              <Plus className="w-4 h-4" /> Novo Fornecedor
            </Button>
          </div>
          {suppliers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum fornecedor cadastrado
            </p>
          )}
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-2xl bg-secondary/30 text-xs space-y-1 flex items-start justify-between"
            >
              <div>
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-muted-foreground">
                  {s.suppliedProduct} • {s.city}
                </p>
              </div>
              <RecordActionMenu onEdit={() => openSupEdit(s)} onDelete={() => setDeletingSup(s)} />
            </div>
          ))}
        </Card>
      </div>

      {/* Cliente Dialog */}
      <Dialog
        open={custOpen}
        onOpenChange={(v) => !v && (setCustOpen(false), setEditingCust(null))}
      >
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCust ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastro de cliente. Nenhum lote necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input
                value={custForm.name}
                onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input
                  value={custForm.phone}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">WhatsApp</Label>
                <Input
                  value={custForm.whatsapp}
                  onChange={(e) => setCustForm({ ...custForm, whatsapp: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cidade</Label>
              <Input
                value={custForm.city}
                onChange={(e) => setCustForm({ ...custForm, city: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={custForm.notes}
                onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {editingCust ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fornecedor Dialog */}
      <Dialog open={supOpen} onOpenChange={(v) => !v && (setSupOpen(false), setEditingSup(null))}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingSup ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastro de fornecedor. Nenhum lote necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSupSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input
                value={supForm.name}
                onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Produto fornecido</Label>
              <Input
                value={supForm.suppliedProduct}
                onChange={(e) => setSupForm({ ...supForm, suppliedProduct: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input
                  value={supForm.phone}
                  onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade</Label>
                <Input
                  value={supForm.city}
                  onChange={(e) => setSupForm({ ...supForm, city: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={supForm.notes}
                onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {editingSup ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingCust}
        onOpenChange={(v) => !v && setDeletingCust(null)}
        onConfirm={handleDeleteCust}
      />
      <DeleteConfirmDialog
        open={!!deletingSup}
        onOpenChange={(v) => !v && setDeletingSup(null)}
        onConfirm={handleDeleteSup}
      />
    </div>
  )
}
