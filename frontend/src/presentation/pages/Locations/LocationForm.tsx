import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert,
} from '@mui/material'
import { LocationCreatePayload } from '@/application/api/locations'

interface LocationFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: LocationCreatePayload) => void
  initialData?: any
  allLocations: Array<{ id: string; name: string }>
  error: string | null
}

export default function LocationForm({ open, onClose, onSave, initialData, allLocations, error }: LocationFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: LocationCreatePayload = {
      name: formData.get('name') as string,
      code: (formData.get('code') as string) || undefined,
      parent_id: (formData.get('parent_id') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar UbicaciÃ³n' : 'Nueva UbicaciÃ³n'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="name" label="Nombre" required fullWidth defaultValue={initialData?.name || ''} />
            <TextField name="code" label="CÃ³digo" fullWidth defaultValue={initialData?.code || ''} />
            <FormControl fullWidth>
              <InputLabel>UbicaciÃ³n padre</InputLabel>
              <Select name="parent_id" label="UbicaciÃ³n padre" defaultValue={initialData?.parent_id || ''}>
                <MenuItem value="">Ninguna (raÃ­z)</MenuItem>
                {allLocations
                  .filter(loc => loc.id !== initialData?.id)
                  .map(loc => (<MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField name="address" label="DirecciÃ³n" fullWidth defaultValue={initialData?.address || ''} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear ubicaciÃ³n'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
