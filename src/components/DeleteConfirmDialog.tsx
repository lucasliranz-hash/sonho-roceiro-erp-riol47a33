import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
  /** Título customizado (ex: "Excluir lançamento de ração?") */
  title?: string
  /** Descrição customizada */
  description?: string
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, title, description }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || 'Tem certeza que deseja excluir este registro?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'Esta ação não pode ser desfeita. O registro será removido.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
