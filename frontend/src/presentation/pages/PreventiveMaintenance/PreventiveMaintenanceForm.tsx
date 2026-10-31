import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert,
} from '@mui/material'
import { MaintenancePlanCreatePayload } from '@/application/api/preventive_maintenance'

interface PreventiveMaintenanceFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: MaintenancePlanCreatePayload) => void
  initialData?: any
  assets: Array<{ id: string; name: string }>
  error: string | null
}

export default function PreventiveMaintenanceForm({ open, onClose, onSave, initialData, assets, error }: PreventiveMaintenanceFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: MaintenancePlanCreatePayload = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      asset_id: formData.get('asset_id') as string,
      frequency_type: formData.get('frequency_type') as string,
      frequency_value: parseInt(formData.get('frequency_value') as string) || 1,
      estimated_hours: parseFloat(formData.get('estimated_hours') as string) || undefined,
      priority: formData.get('priority') as string || 'MEDIUM',
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Plan Preventivo' : 'Nuevo Plan Preventivo'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="name" label="Nombre" required fullWidth defaultValue={initialData?.name || ''} />
            <TextField name="description" label="Descripción" fullWidth multiline rows={2} defaultValue={initialData?.description || ''} />
            <FormControl fullWidth>
              <InputLabel>Activo</InputLabel>
              <Select name="asset_id" label="Activo" defaultValue={initialData?.asset_id || ''}>
                <MenuItem value="">Seleccionar activo...</MenuItem>
                {assets.map(a => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frecuencia</InputLabel>
              <Select name="frequency_type" label="Frecuencia" defaultValue={initialData?.frequency_type || 'MONTHLY'}>
                <MenuItem value="DAILY">Diario</MenuItem>
                <MenuItem value="WEEKLY">Semanal</MenuItem>
                <MenuItem value="MONTHLY">Mensual</MenuItem>
                <MenuItem value="QUARTERLY">Trimestral</MenuItem>
                <MenuItem value="YEARLY">Anual</MenuItem>
              </Select>
            </FormControl>
            <TextField name="frequency_value" label="Valor frecuencia" type="number" fullWidth InputProps={{ inputProps: { min: 1, max: 365 } }} defaultValue={initialData?.frequency_value || 1} />
            <TextField name="estimated_hours" label="Horas estimadas" type="number" fullWidth InputProps={{ inputProps: { min: 0, step: 0.5 } }} defaultValue={initialData?.estimated_hours || ''} />
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select name="priority" label="Prioridad" defaultValue={initialData?.priority || 'MEDIUM'}>
                <MenuItem value="LOW">Baja</MenuItem>
                <MenuItem value="MEDIUM">Media</MenuItem>
                <MenuItem value="HIGH">Alta</MenuItem>
                <MenuItem value="CRITICAL">Crítica</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear plan'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
