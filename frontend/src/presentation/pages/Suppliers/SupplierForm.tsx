import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Alert,
} from '@mui/material'
import { SupplierCreatePayload } from '@/application/api/suppliers'

interface SupplierFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: SupplierCreatePayload) => void
  initialData?: any
  error: string | null
}

export default function SupplierForm({ open, onClose, onSave, initialData, error }: SupplierFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: SupplierCreatePayload = {
      name: formData.get('name') as string,
      tax_id: (formData.get('tax_id') as string) || undefined,
      contact_person: (formData.get('contact_person') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="name" label="Nombre" required fullWidth defaultValue={initialData?.name || ''} />
            <TextField name="tax_id" label="CIF / Tax ID" fullWidth defaultValue={initialData?.tax_id || ''} />
            <TextField name="contact_person" label="Persona de contacto" fullWidth defaultValue={initialData?.contact_person || ''} />
            <TextField name="email" label="Email" type="email" fullWidth defaultValue={initialData?.email || ''} />
            <TextField name="phone" label="Teléfono" fullWidth defaultValue={initialData?.phone || ''} />
            <TextField name="address" label="Dirección" fullWidth defaultValue={initialData?.address || ''} />
            <TextField name="notes" label="Notas" fullWidth multiline rows={2} defaultValue={initialData?.notes || ''} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear proveedor'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
