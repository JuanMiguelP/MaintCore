import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert,
} from '@mui/material'
import { WorkOrderCreatePayload } from '@/application/api/work_orders'

interface WorkOrderFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: WorkOrderCreatePayload) => void
  initialData?: any
  assets: Array<{ id: string; name: string }>
  technicians: Array<{ id: string; name: string }>
  error: string | null
}

export default function WorkOrderForm({ open, onClose, onSave, initialData, assets, technicians, error }: WorkOrderFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: WorkOrderCreatePayload = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      asset_id: (formData.get('asset_id') as string) || undefined,
      priority: formData.get('priority') as string || 'MEDIUM',
      assigned_to: (formData.get('assigned_to') as string) || undefined,
      scheduled_date: (formData.get('scheduled_date') as string) || undefined,
      estimated_hours: parseFloat(formData.get('estimated_hours') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="title" label="Título" required fullWidth defaultValue={initialData?.title || ''} />
            <TextField name="description" label="Descripción" fullWidth multiline rows={2} defaultValue={initialData?.description || ''} />
            <FormControl fullWidth>
              <InputLabel>Activo</InputLabel>
              <Select name="asset_id" label="Activo" defaultValue={initialData?.asset_id || ''}>
                <MenuItem value="">Sin activo</MenuItem>
                {assets.map(a => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select name="priority" label="Prioridad" defaultValue={initialData?.priority || 'MEDIUM'}>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Técnico asignado</InputLabel>
              <Select name="assigned_to" label="Técnico asignado" defaultValue={initialData?.assigned_to || ''}>
                <MenuItem value="">Sin técnico</MenuItem>
                {technicians.map(t => (<MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField name="scheduled_date" label="Fecha programada" type="date" fullWidth InputLabelProps={{ shrink: true }} defaultValue={initialData?.scheduled_date || ''} />
            <TextField name="estimated_hours" label="Horas estimadas" type="number" fullWidth InputProps={{ inputProps: { min: 0, step: 0.5 } }} defaultValue={initialData?.estimated_hours || ''} />
            <TextField name="notes" label="Notas" fullWidth multiline rows={2} defaultValue={initialData?.notes || ''} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear orden'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
