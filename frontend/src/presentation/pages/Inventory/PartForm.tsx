import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from '@mui/material'
import { PartCreatePayload, PartResponse, SupplierResponse } from '@/application/api/inventory'

interface PartFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: PartCreatePayload) => void
  initialData?: PartResponse | null
  suppliers: SupplierResponse[]
  error: string | null
}

export default function PartForm({ open, onClose, onSave, initialData, suppliers, error }: PartFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: PartCreatePayload = {
      part_number: formData.get('part_number') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      supplier_id: (formData.get('supplier_id') as string) || undefined,
      unit_cost: parseFloat(formData.get('unit_cost') as string) || 0,
      minimum_stock: parseInt(formData.get('minimum_stock') as string) || 0,
      current_stock: parseInt(formData.get('current_stock') as string) || 0,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="part_number"
              label="Part Number"
              required
              fullWidth
              defaultValue={initialData?.part_number || ''}
            />
            <TextField
              name="name"
              label="Nombre"
              required
              fullWidth
              defaultValue={initialData?.name || ''}
            />
            <TextField
              name="description"
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              defaultValue={initialData?.description || ''}
            />
            <FormControl fullWidth>
              <InputLabel>Proveedor</InputLabel>
              <Select
                name="supplier_id"
                label="Proveedor"
                defaultValue={initialData?.supplier_name ? suppliers.find(s => s.name === initialData.supplier_name)?.id || '' : ''}
              >
                <MenuItem value="">Sin proveedor</MenuItem>
                {suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="unit_cost"
              label="Coste unitario (€)"
              type="number"
              fullWidth
              inputProps={{ step: '0.01', min: '0' }}
              defaultValue={initialData?.unit_cost || 0}
            />
            <TextField
              name="minimum_stock"
              label="Stock mínimo"
              type="number"
              fullWidth
              inputProps={{ step: '1', min: '0' }}
              defaultValue={initialData?.minimum_stock || 0}
            />
            <TextField
              name="current_stock"
              label="Stock actual"
              type="number"
              fullWidth
              inputProps={{ step: '1', min: '0' }}
              defaultValue={initialData?.current_stock || 0}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear repuesto'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
