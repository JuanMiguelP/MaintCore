import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Alert,
} from '@mui/material'
import { NotificationRuleCreatePayload } from '@/application/api/notifications'

interface NotificationRuleFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: NotificationRuleCreatePayload) => void
  initialData?: any
  error: string | null
}

const EVENT_TYPES = [
  'LOW_STOCK', 'OUT_OF_STOCK', 'STOCK_RECOVERED',
  'WORK_ORDER_ASSIGNED', 'WORK_ORDER_COMPLETED', 'WORK_ORDER_CANCELLED',
  'PREVENTIVE_OVERDUE', 'CRITICAL_WORK_ORDER',
]

export default function NotificationRuleForm({ open, onClose, onSave, initialData, error }: NotificationRuleFormProps) {
  const isEdit = !!initialData

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const payload: NotificationRuleCreatePayload = {
      name: formData.get('name') as string,
      event_type: formData.get('event_type') as string,
      enabled: formData.get('enabled') === 'true',
      recipients: (formData.get('recipients') as string).split(',').map(r => r.trim()).filter(Boolean),
      frequency: (formData.get('frequency') as string) || undefined,
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Regla de Notificación' : 'Nueva Regla de Notificación'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="name" label="Nombre" required fullWidth defaultValue={initialData?.name || ''} />
            <FormControl fullWidth>
              <InputLabel>Tipo de evento</InputLabel>
              <Select name="event_type" label="Tipo de evento" defaultValue={initialData?.event_type || 'LOW_STOCK'}>
                {EVENT_TYPES.map(et => (<MenuItem key={et} value={et}>{et.replace(/_/g, ' ')}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField name="recipients" label="Destinatarios (emails separados por coma)" required fullWidth defaultValue={initialData?.recipients?.join(', ') || ''} />
            <TextField name="frequency" label="Frecuencia" fullWidth defaultValue={initialData?.frequency || ''} />
            <FormControl fullWidth>
              <InputLabel>Activa</InputLabel>
              <Select name="enabled" label="Activa" defaultValue={initialData?.enabled !== false ? 'true' : 'false'}>
                <MenuItem value="true">Sí</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Guardar cambios' : 'Crear regla'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
