import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert,
} from '@mui/material'
import { AssetCreatePayload, AssetResponse, CategoryResponse, LocationResponse } from '@/application/api/assets'

interface AssetFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: AssetCreatePayload) => void
  initialData?: AssetResponse | null
  categories: CategoryResponse[]
  locations: LocationResponse[]
  error: string | null
}

export default function AssetForm({ open, onClose, onSave, initialData, categories, locations, error }: AssetFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: AssetCreatePayload = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category_id: (formData.get('category_id') as string) || '',
      location_id: (formData.get('location_id') as string) || undefined,
      manufacturer: (formData.get('manufacturer') as string) || undefined,
      model: (formData.get('model') as string) || undefined,
      serial_number: (formData.get('serial_number') as string) || undefined,
      purchase_date: (formData.get('purchase_date') as string) || undefined,
      status: formData.get('status') as string || 'ACTIVE',
      notes: (formData.get('notes') as string) || undefined,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="code" label="Código / Asset Number" required fullWidth defaultValue={initialData?.code || ''} />
            <TextField name="name" label="Nombre" required fullWidth defaultValue={initialData?.name || ''} />
            <TextField name="description" label="Descripción" fullWidth multiline rows={2} defaultValue={initialData?.description || ''} />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select name="category_id" label="Categoría" defaultValue={initialData?.category_name ? categories.find(c => c.name === initialData.category_name)?.id || '' : ''}>
                <MenuItem value="">Seleccionar categoría</MenuItem>
                {categories.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Ubicación</InputLabel>
              <Select name="location_id" label="Ubicación" defaultValue={initialData?.location_name ? locations.find(l => l.name === initialData.location_name)?.id || '' : ''}>
                <MenuItem value="">Sin ubicación</MenuItem>
                {locations.map(l => (<MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField name="manufacturer" label="Fabricante" fullWidth defaultValue={initialData?.manufacturer || ''} />
            <TextField name="model" label="Modelo" fullWidth defaultValue={initialData?.model || ''} />
            <TextField name="serial_number" label="Número de serie" fullWidth defaultValue={initialData?.serial_number || ''} />
            <TextField name="purchase_date" label="Fecha de compra" type="date" fullWidth InputLabelProps={{ shrink: true }} defaultValue={initialData?.purchase_date || ''} />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="status" label="Estado" defaultValue={initialData?.status || 'ACTIVE'}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="RETIRED">Retired</MenuItem>
              </Select>
            </FormControl>
            <TextField name="notes" label="Notas" fullWidth multiline rows={2} defaultValue={initialData?.notes || ''} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear activo'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
